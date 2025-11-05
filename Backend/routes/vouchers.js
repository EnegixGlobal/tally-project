const express = require('express');
const router = express.Router();
const db = require('../db'); // mysql2/promise pool

router.post('/', async (req, res) => {
  const {
    type, mode, date, number, narration, referenceNo, supplierInvoiceDate,
    entries = [],
    companyId, ownerType, ownerId // <-- new
  } = req.body;

  if (!type || !date || !entries.length || !companyId || !ownerType || !ownerId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Insert into voucher_main with tenant fields
    const [voucherResult] = await conn.execute(
      `INSERT INTO voucher_main 
      (voucher_type, voucher_number, date, narration, reference_no, supplier_invoice_date, company_id, owner_type, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type,
        number || null,
        date,
        narration || null,
        referenceNo || null,
        supplierInvoiceDate || null,
        companyId,
        ownerType,
        ownerId
      ]
    );

    const voucherId = voucherResult.insertId;

    // Insert voucher_entries as before
    const entryValues = entries.map(entry => [
      voucherId,
      entry.ledgerId,
      parseFloat(entry.amount || 0),
      entry.type || 'debit',
      entry.narration || null,
      entry.bankName || null,
      entry.chequeNumber || null,
      entry.costCentreId || null
    ]);

    await conn.query(
      `INSERT INTO voucher_entries 
        (voucher_id, ledger_id, amount, entry_type, narration, bank_name, cheque_number, cost_centre_id)
       VALUES ?`,
      [entryValues]
    );

    await conn.commit();
    conn.release();

    res.status(200).json({
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} voucher saved successfully`
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({
      message: 'Failed to save voucher',
      error: err.message
    });
  }
});

router.get('/', async (req, res) => {
  const { companyId, ownerType, ownerId, voucherType } = req.query;

  if (!companyId || !ownerType || !ownerId || !voucherType) {
    return res.status(400).json({ message: 'companyId, ownerType, ownerId, voucherType required' });
  }

  try {
    // Get all vouchers for the tenant with dynamic voucherType
    const [vouchers] = await db.execute(
      `SELECT v.id, v.voucher_number AS number, v.voucher_type AS type, v.date, v.reference_no, v.narration
       FROM voucher_main v
       WHERE v.company_id = ? AND v.owner_type = ? AND v.owner_id = ? AND v.voucher_type = ?
       ORDER BY v.date DESC, v.id DESC`,
      [companyId, ownerType, ownerId, voucherType]
    );

    // Get all entries for these vouchers
    const voucherIds = vouchers.map(v => v.id);
    let entries = [];
    if (voucherIds.length > 0) {
      const [entryRows] = await db.query(
        `SELECT e.id, e.voucher_id, e.ledger_id, e.amount, e.entry_type AS type, e.narration
         FROM voucher_entries e
         WHERE e.voucher_id IN (${voucherIds.map(() => '?').join(',')})
         ORDER BY e.id`,
        voucherIds
      );
      entries = entryRows;
    }

    // Map entries to their vouchers
    const result = vouchers.map(voucher => ({
      ...voucher,
      entries: entries.filter(e => e.voucher_id === voucher.id).map(({ voucher_id, ...rest }) => rest)
    }));

    res.json({ data: result });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ message: 'Failed to fetch vouchers', error: error.message });
  }
});


module.exports = router;
