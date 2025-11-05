const express = require('express');
const router = express.Router();
const db = require('../db'); // Make sure db is using mysql2.promise()

// GET Ledgers
router.get('/ledgers', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM ledgers');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Items
router.get('/items', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM items');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Sales Voucher
router.post('/', async (req, res) => {
  const {
    number, date, narration, partyId, referenceNo,
    dispatchDetails, subtotal, cgstTotal, sgstTotal,
    igstTotal, discountTotal, total, entries, type,
    mode, isQuotation, salesLedgerId, supplierInvoiceDate,
    companyId, ownerType, ownerId // <-- required for multi-tenant!
  } = req.body;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ message: 'companyId, ownerType, and ownerId are required' });
  }

  // Extract dispatch details
  const dispatchDocNo = dispatchDetails?.docNo || null;
  const dispatchThrough = dispatchDetails?.through || null;
  const destination = dispatchDetails?.destination || null;

  let insertVoucherSql = '';
  let insertVoucherValues = [];
  let voucherId;

  // Insert into sales_vouchers, including all new fields and tenant fields
  if (mode === 'item-invoice') {
    insertVoucherSql = `
      INSERT INTO sales_vouchers (
        number, date, narration, partyId, referenceNo,
        dispatchDocNo, dispatchThrough, destination, subtotal, cgstTotal,
        sgstTotal, igstTotal, discountTotal, total, type, isQuotation, salesLedgerId, supplierInvoiceDate,
        company_id, owner_type, owner_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    insertVoucherValues = [
      number ?? null, date ?? null, narration ?? null, partyId ?? null, referenceNo ?? null,
      dispatchDocNo ?? null, dispatchThrough ?? null, destination ?? null,
      subtotal ?? 0, cgstTotal ?? 0, sgstTotal ?? 0, igstTotal ?? 0,
      discountTotal ?? 0, total ?? 0,
      type ?? 'sales',
      isQuotation ? 1 : 0,
      salesLedgerId ?? null,
      supplierInvoiceDate ?? null,
      companyId, ownerType, ownerId
    ];
  } else {
    // fallback to accounting voucher - include tenant fields
    insertVoucherSql = `
      INSERT INTO voucher_main (
        voucher_number, date, narration, company_id, owner_type, owner_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    insertVoucherValues = [
      number ?? null, date ?? null, narration ?? null,
      companyId, ownerType, ownerId
    ];
  }

  try {
    const [voucherResult] = await db.execute(insertVoucherSql, insertVoucherValues);
    voucherId = voucherResult.insertId;

    // Split entries for items and ledgers
    const itemEntries = entries.filter(e => e.itemId);
    const ledgerEntries = entries.filter(e => e.ledgerId);

    // Insert into sales_voucher_items, including more fields for GST, discount, godown, batch, hsn, etc.
    if (itemEntries.length > 0) {
      const insertItemQuery = `
        INSERT INTO sales_voucher_items (
          voucherId, itemId, quantity, rate, amount, cgstRate, sgstRate, igstRate,
          discount, hsnCode, batchNumber, godownId
        ) VALUES ?
      `;
      const itemValues = itemEntries.map(e => [
        voucherId,
        e.itemId,
        e.quantity,
        e.rate,
        e.amount,
        e.cgstRate ?? 0,
        e.sgstRate ?? 0,
        e.igstRate ?? 0,
        e.discount ?? 0,
        e.hsnCode ?? '',
        e.batchNumber ?? '',
        e.godownId ?? null
      ]);
      await db.query(insertItemQuery, [itemValues]);
    }

    // Insert into voucher_entries (general accounting lines)
    if (ledgerEntries.length > 0) {
      const insertLedgerQuery = `
        INSERT INTO voucher_entries (voucher_id, ledger_id, amount, entry_type)
        VALUES ?
      `;
      const ledgerValues = ledgerEntries.map(e => [
        voucherId,
        e.ledgerId,
        e.amount,
        e.type
      ]);
      await db.query(insertLedgerQuery, [ledgerValues]);
    }

    return res.status(200).json({
      message: 'Voucher saved successfully',
      id: voucherId
    });
  } catch (err) {
    console.error('Voucher save failed:', err);
    return res.status(500).json({ error: err.message || 'Something went wrong' });
  }
});


module.exports = router;
