const express = require('express');
const router = express.Router();
const db = require('../db');

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

// POST Purchase Voucher
router.post('/', async (req, res) => {
  const {
    number , date, narration, partyId, referenceNo, supplierInvoiceDate,
    dispatchDetails, subtotal, cgstTotal, sgstTotal, igstTotal,
    discountTotal, total, entries, mode, purchaseLedgerId
  } = req.body;

  const dispatchDocNo = dispatchDetails?.docNo || null;
  const dispatchThrough = dispatchDetails?.through || null;
  const destination = dispatchDetails?.destination || null;

  let insertVoucherSql = '';
  let insertVoucherValues = [];
  let voucherId;

  if (mode === 'item-invoice') {
    insertVoucherSql = `
      INSERT INTO purchase_vouchers (
    number, date, supplierInvoiceDate, narration, partyId, referenceNo,
    dispatchDocNo, dispatchThrough, destination, purchaseLedgerId,
    subtotal, cgstTotal, sgstTotal, igstTotal, discountTotal, total
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    insertVoucherValues = [
      number ?? null, date ?? null, supplierInvoiceDate ?? null, narration ?? null, partyId ?? null, referenceNo ?? null,
      dispatchDocNo ?? null, dispatchThrough ?? null, destination ?? null, purchaseLedgerId ?? null,
      subtotal ?? 0, cgstTotal ?? 0, sgstTotal ?? 0, igstTotal ?? 0, discountTotal ?? 0, total ?? 0
    ];
  } else {
    insertVoucherSql = `
      INSERT INTO voucher_main (voucher_number, date, narration)
    VALUES (?, ?, ?, ?, ?, ?)
    `;
    insertVoucherValues = [
      number ?? null, date ?? null, narration ?? null  ?? 0
    ];
  }

  try {
    const [voucherResult] = await db.execute(insertVoucherSql, insertVoucherValues);
    voucherId = voucherResult.insertId;

    const itemEntries = entries.filter(e => e.itemId);
    const ledgerEntries = entries.filter(e => e.ledgerId);

    if (itemEntries.length > 0) {
      const insertItemQuery = `
        INSERT INTO purchase_voucher_items (
          voucherId, itemId, quantity, rate, discount, cgstRate, sgstRate, igstRate, amount, godownId
        ) VALUES ?
      `;
      const itemValues = itemEntries.map(e => [
        voucherId?? null,
        e.itemId?? null,
        e.quantity?? null,
        e.rate?? null,
        e.discount ?? 0,
        e.cgstRate ?? 0,
        e.sgstRate ?? 0,
        e.igstRate ?? 0,
        e.amount ?? 0,
        e.godownId ?? null
      ]);
      await db.query(insertItemQuery, [itemValues]);
    }

    if (ledgerEntries.length > 0) {
      const insertLedgerQuery = `
        INSERT INTO voucher_entries (voucher_id, ledger_id, amount, entry_type) VALUES ?
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
      message: 'Purchase voucher saved successfully',
      id: voucherId
    });

  } catch (err) {
    console.error('Purchase voucher save failed:', err);
    return res.status(500).json({ error: err.message || 'Something went wrong' });
  }
});

// get ourchase vouncher
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM purchase_vouchers');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await db.execute(
      "DELETE FROM voucher_entries WHERE voucher_id = ?",
      [id]
    );

    await db.execute(
      "DELETE FROM purchase_voucher_items WHERE voucherId = ?",
      [id]
    );

    const [result] = await db.execute(
      "DELETE FROM purchase_vouchers WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    return res.json({ message: "Voucher deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ error: err.message });
  }
});

//single GET
router.get("/:id", async (req, res) => {
  try {
    const voucherId = req.params.id;

    const [voucherRows] = await db.execute(
      "SELECT * FROM purchase_vouchers WHERE id = ?",
      [voucherId]
    );

    if (voucherRows.length === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const voucher = voucherRows[0];

    const [itemRows] = await db.execute(
      "SELECT * FROM purchase_voucher_items WHERE voucherId = ?",
      [voucherId]
    );

    const [ledgerRows] = await db.execute(
      "SELECT * FROM voucher_entries WHERE voucher_id = ?",
      [voucherId]
    );

    return res.json({
      ...voucher,
      entries: [...itemRows, ...ledgerRows],
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


//put code
// UPDATE PURCHASE VOUCHER
router.put("/:id", async (req, res) => {
  const voucherId = req.params.id;

  const {
    number, date, narration, partyId, referenceNo, supplierInvoiceDate,
    dispatchDetails, subtotal, cgstTotal, sgstTotal, igstTotal,
    discountTotal, total, purchaseLedgerId
  } = req.body;

  const dispatchDocNo = dispatchDetails?.docNo || null;
  const dispatchThrough = dispatchDetails?.through || null;
  const destination = dispatchDetails?.destination || null;

  try {
    const updateSql = `
      UPDATE purchase_vouchers SET
        number = ?,
        date = ?,
        supplierInvoiceDate = ?,
        narration = ?,
        partyId = ?,
        referenceNo = ?,
        dispatchDocNo = ?,
        dispatchThrough = ?,
        destination = ?,
        purchaseLedgerId = ?,
        subtotal = ?,
        cgstTotal = ?,
        sgstTotal = ?,
        igstTotal = ?,
        discountTotal = ?,
        total = ?
      WHERE id = ?
    `;

    await db.execute(updateSql, [
      number ?? null,
      date ?? null,
      supplierInvoiceDate ?? null,
      narration ?? null,
      partyId ?? null,
      referenceNo ?? null,
      dispatchDocNo ?? null,
      dispatchThrough ?? null,
      destination ?? null,
      purchaseLedgerId ?? null,
      subtotal ?? 0,
      cgstTotal ?? 0,
      sgstTotal ?? 0,
      igstTotal ?? 0,
      discountTotal ?? 0,
      total ?? 0,
      voucherId
    ]);

    res.json({
      message: "Voucher updated successfully",
      id: voucherId
    });

  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ error: err.message });
  }
});





module.exports = router;
