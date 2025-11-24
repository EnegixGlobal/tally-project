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
  console.log("POST /sales-vouchers hit");

  try {
    const {
      number, 
      date, 
      narration,
      partyId, 
      referenceNo,
      dispatchDetails,
      subtotal, 
      cgstTotal, 
      sgstTotal,
      igstTotal, 
      discountTotal, 
      total,
      type,
      mode,
      isQuotation,
      salesLedgerId,
      supplierInvoiceDate,

      // MULTI TENANT
      companyId,
      ownerType,
      ownerId,

      // ENTRIES (frontend may send `entries` or `items`)
      entries,
      items
    } = req.body;
    console.log('total', total)

    // Required Fields
    if (!companyId || !ownerType || !ownerId) {
      return res.status(400).json({
        success: false,
        message: "companyId, ownerType & ownerId are required"
      });
    }

    // Merge entries
    const receivedEntries = Array.isArray(entries)
      ? entries
      : Array.isArray(items)
      ? items
      : [];

    // Extract dispatch fields
    const dispatchDocNo = dispatchDetails?.docNo || null;
    const dispatchThrough = dispatchDetails?.through || null;
    const destination = dispatchDetails?.destination || null;

    let voucherId;

    // ----------------------------
    // INSERT MAIN SALES VOUCHER
    // ----------------------------
    const insertVoucherSQL = `
      INSERT INTO sales_vouchers (
        number, date, narration, partyId, referenceNo,
        dispatchDocNo, dispatchThrough, destination,
        subtotal, cgstTotal, sgstTotal, igstTotal, discountTotal, total,
        type, isQuotation, salesLedgerId, supplierInvoiceDate,
        company_id, owner_type, owner_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const voucherValues = [
      number ?? null,
      date ?? null,
      narration ?? "",
      partyId ?? null,
      referenceNo ?? null,
      dispatchDocNo,
      dispatchThrough,
      destination,
      subtotal ?? 0,
      cgstTotal ?? 0,
      sgstTotal ?? 0,
      igstTotal ?? 0,
      discountTotal ?? 0,
      total ?? 0,
      type || "sales",
      isQuotation ? 1 : 0,
      salesLedgerId ?? null,
      supplierInvoiceDate ?? null,
      companyId, ownerType, ownerId
    ];

    const [voucherResult] = await db.execute(insertVoucherSQL, voucherValues);
    voucherId = voucherResult.insertId;

    // ----------------------------
    // SPLIT ITEM + LEDGER ENTRIES
    // ----------------------------
    const itemEntries = receivedEntries.filter(e => e.itemId);
    const ledgerEntries = receivedEntries.filter(e => e.ledgerId);

    // ----------------------------
    // INSERT ITEM ENTRIES
    // ----------------------------
    if (itemEntries.length > 0) {
      const insertItemsSQL = `
        INSERT INTO sales_voucher_items (
          voucherId, itemId, quantity, rate, amount,
          cgstRate, sgstRate, igstRate,
          discount, hsnCode, batchNumber, godownId
        ) VALUES ?
      `;

      const itemValues = itemEntries.map(e => [
        voucherId,
        e.itemId,
        e.quantity ?? 0,
        e.rate ?? 0,
        e.amount ?? 0,
        e.cgstRate ?? 0,
        e.sgstRate ?? 0,
        e.igstRate ?? 0,
        e.discount ?? 0,
        e.hsnCode ?? "",
        e.batchNumber ?? "",
        e.godownId ?? null
      ]);

      await db.query(insertItemsSQL, [itemValues]);
    }

    // ----------------------------
    // INSERT LEDGER ENTRIES
    // ----------------------------
    if (ledgerEntries.length > 0) {
      const insertLedgerSQL = `
        INSERT INTO voucher_entries (
          voucher_id, ledger_id, amount, entry_type
        ) VALUES ?
      `;

      const ledgerValues = ledgerEntries.map(e => [
        voucherId,
        e.ledgerId,
        e.amount,
        e.type
      ]);

      await db.query(insertLedgerSQL, [ledgerValues]);
    }

    return res.status(200).json({
      success: true,
      message: "Voucher saved successfully",
      id: voucherId
    });

  } catch (err) {
    console.error("Voucher save failed:", err);
    return res.status(500).json({
      success: false,
      message: "Error saving voucher",
      error: err.message
    });
  }
});


// get ourchase vouncher
router.get('/', async (req, res) => {
  const { owner_type, owner_id } = req.query;

  if (!owner_type || !owner_id) {
    return res.status(400).json({
      message: "owner_type & owner_id are required"
    });
  }

  try {
    const [voucherRows] = await db.execute(
      `SELECT 
          id, number, date, partyId, referenceNo, supplierInvoiceDate,
          subtotal, cgstTotal, sgstTotal, igstTotal, discountTotal, total
       FROM sales_vouchers
       WHERE owner_type = ? AND owner_id = ?
       ORDER BY id DESC`,
      [owner_type, owner_id]
    );

    return res.status(200).json(voucherRows);

  } catch (err) {
    console.error("Failed to load sales vouchers:", err);
    return res.status(500).json({ message: err.message });
  }
});


//delete
router.delete('/:id', async (req, res) => {
  const voucherId = req.params.id;

  try {
    // 1️⃣ Delete items
    await db.execute(
      `DELETE FROM sales_voucher_items WHERE voucherId = ?`,
      [voucherId]
    );

    // 2️⃣ Delete ledger entries
    await db.execute(
      `DELETE FROM voucher_entries WHERE voucher_id = ?`,
      [voucherId]
    );

    // 3️⃣ Delete from main sales_vouchers table
    const [result] = await db.execute(
      `DELETE FROM sales_vouchers WHERE id = ?`,
      [voucherId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    return res.json({ message: "Sales voucher deleted successfully" });

  } catch (err) {
    console.error("Delete failed:", err);
    return res.status(500).json({ message: err.message || "Delete failed" });
  }
});

//single get
router.get('/:id', async (req, res) => {
  const voucherId = req.params.id;

  try {
    // ---- 1) Main Voucher ----
    const [voucherRows] = await db.execute(
      `SELECT * FROM sales_vouchers WHERE id = ?`,
      [voucherId]
    );

    if (voucherRows.length === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const voucher = voucherRows[0];

    // ---- 2) Items ----
    const [itemRows] = await db.execute(
      `SELECT *
       FROM sales_voucher_items
       WHERE voucherId = ?`,
      [voucherId]
    );

    // ---- 3) Ledger Entries ----
    const [ledgerRows] = await db.execute(
      `SELECT *
       FROM voucher_entries
       WHERE voucher_id = ?`,
      [voucherId]
    );

  
    return res.json({
      success: true,
      voucher,
      items: itemRows,
      ledgerEntries: ledgerRows,
    });

  } catch (err) {
    console.error("GET sales voucher failed:", err);
    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
});

//single put
router.put('/:id', async (req, res) => {
  const voucherId = req.params.id;

  // frontend se ye sab aa raha hoga:
  const {
    date,
    number,
    narration,
    referenceNo,
    partyId,
    dispatchDetails,
    subtotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    discountTotal,
    total,
    entries,
    isQuotation,
    salesLedgerId
  } = req.body;

  try {
    // ---- 1) UPDATE MAIN TABLE ----
    await db.execute(
      `UPDATE sales_vouchers
       SET 
         date = ?, 
         number = ?, 
         narration = ?, 
         referenceNo = ?, 
         partyId = ?, 
         dispatchDocNo = ?, 
         dispatchThrough = ?, 
         destination = ?, 
         subtotal = ?, 
         cgstTotal = ?, 
         sgstTotal = ?, 
         igstTotal = ?, 
         discountTotal = ?, 
         total = ?, 
         isQuotation = ?, 
         salesLedgerId = ?
       WHERE id = ?`,
      [
        date,
        number,
        narration,
        referenceNo,
        partyId,
        dispatchDetails?.docNo || null,
        dispatchDetails?.through || null,
        dispatchDetails?.destination || null,
        subtotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        discountTotal,
        total,
        isQuotation ? 1 : 0,
        salesLedgerId,
        voucherId
      ]
    );

    // ---- 2) DELETE OLD ITEM ROWS ----
    await db.execute(
      `DELETE FROM sales_voucher_items WHERE voucherId = ?`,
      [voucherId]
    );

    // ---- 3) INSERT NEW ITEM ROWS ----
    const itemEntries = entries.filter(e => e.itemId);

    if (itemEntries.length > 0) {
      const itemValues = itemEntries.map(e => [
        voucherId,
        e.itemId,
        e.quantity,
        e.rate,
        e.amount,
        e.cgstRate,
        e.sgstRate,
        e.igstRate,
        e.discount,
        e.hsnCode,
        e.batchNumber,
        e.godownId
      ]);

      await db.query(
        `INSERT INTO sales_voucher_items 
        (voucherId, itemId, quantity, rate, amount, cgstRate, sgstRate, igstRate, discount, hsnCode, batchNumber, godownId)
        VALUES ?`,
        [itemValues]
      );
    }

    // ---- 4) DELETE OLD LEDGER ENTRIES ----
    await db.execute(
      `DELETE FROM voucher_entries WHERE voucher_id = ?`,
      [voucherId]
    );

    // ---- 5) INSERT NEW LEDGER ENTRIES ----
    const ledgerEntries = entries.filter(e => e.ledgerId);

    if (ledgerEntries.length > 0) {
      const ledgerValues = ledgerEntries.map(e => [
        voucherId,
        e.ledgerId,
        e.amount,
        e.type
      ]);

      await db.query(
        `INSERT INTO voucher_entries (voucher_id, ledger_id, amount, entry_type)
         VALUES ?`,
        [ledgerValues]
      );
    }

    return res.json({ success: true, message: "Voucher updated successfully" });

  } catch (err) {
    console.error("Update failed:", err);
    return res.status(500).json({ message: err.message || "Update failed" });
  }
});





module.exports = router;
