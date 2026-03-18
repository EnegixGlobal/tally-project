const express = require('express');
const router = express.Router();
const db = require('../db'); // mysql2/promise connection

// Insert Stock Journal Voucher
router.post('/', async (req, res) => {
  const { date, number, narration, entries, companyId, ownerType, ownerId } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [mainResult] = await connection.query(
      `INSERT INTO stock_journal_vouchers (date, number, narration, company_id, owner_type, owner_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [date, number, narration, companyId, ownerType, ownerId]
    );

    const voucherId = mainResult.insertId;

    const entryValues = entries.map(entry => [
      voucherId,
      entry.ledgerId || null,
      entry.type || 'debit',
      entry.quantity || 0,
      entry.rate || 0,
      entry.amount || 0,
      entry.batchNumber || ''
    ]);

    await connection.query(
      `INSERT INTO stock_journal_entries
      (voucher_id, ledger_id, type, quantity, rate, amount, batch_no)
      VALUES ?`,
      [entryValues]
    );

    await connection.commit();
    res.json({ message: 'Stock Journal Voucher saved successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Insert Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Fetch stock journal vouchers (list) for a company/owner
router.get('/', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ success: false, message: 'company_id, owner_type and owner_id required' });
  }

  try {
    const [rows] = await db.query(
      `SELECT id, date, number, narration, company_id AS companyId, owner_type AS ownerType, owner_id AS ownerId
       FROM stock_journal_vouchers
       WHERE company_id = ? AND owner_type = ? AND owner_id = ?
       ORDER BY date DESC, id DESC`,
      [company_id, owner_type, owner_id]
    );

    return res.json({ success: true, vouchers: rows });
  } catch (err) {
    console.error('Error fetching stock journal vouchers:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
