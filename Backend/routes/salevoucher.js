const express = require("express");
const router = express.Router();
const db = require("../db"); // Make sure db is using mysql2.promise()

// GET Ledgers
router.get("/ledgers", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM ledgers");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Items
router.get("/items", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM items");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Sales Voucher
router.post("/", async (req, res) => {
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
      isQuotation,
      salesLedgerId,
      supplierInvoiceDate,

      companyId,
      ownerType,
      ownerId,

      entries,
      items,
    } = req.body;

    // 🔐 Required checks
    if (!companyId || !ownerType || !ownerId) {
      return res.status(400).json({
        success: false,
        message: "companyId, ownerType & ownerId are required",
      });
    }

    // 🧾 Entries safety
    const receivedEntries = Array.isArray(entries)
      ? entries
      : Array.isArray(items)
      ? items
      : [];

    const dispatchDocNo = dispatchDetails?.docNo || null;
    const dispatchThrough = dispatchDetails?.through || null;
    const destination = dispatchDetails?.destination || null;

    // 🚫 PROFIT COMPLETELY REMOVED
    const insertVoucherSQL = `
      INSERT INTO sales_vouchers (
        number,
        date,
        narration,
        partyId,
        referenceNo,
        dispatchDocNo,
        dispatchThrough,
        destination,
        subtotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        discountTotal,
        total,
        type,
        isQuotation,
        salesLedgerId,
        supplierInvoiceDate,
        company_id,
        owner_type,
        owner_id
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
      companyId,
      ownerType,
      ownerId,
    ];

    const [voucherResult] = await db.execute(
      insertVoucherSQL,
      voucherValues
    );

    const voucherId = voucherResult.insertId;

    // ================= ITEM ENTRIES =================
    const itemEntries = receivedEntries.filter((e) => e.itemId);

    if (itemEntries.length > 0) {
      const itemValues = itemEntries.map((e) => [
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
        e.godownId ?? null,
      ]);

      await db.query(
        `
        INSERT INTO sales_voucher_items
        (
          voucherId,
          itemId,
          quantity,
          rate,
          amount,
          cgstRate,
          sgstRate,
          igstRate,
          discount,
          hsnCode,
          batchNumber,
          godownId
        )
        VALUES ?
        `,
        [itemValues]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Voucher saved successfully",
      id: voucherId,
    });
  } catch (err) {
    console.error("❌ Voucher save failed:", err);
    return res.status(500).json({
      success: false,
      message: "Error saving voucher",
      error: err.message,
    });
  }
});



// GET Sale History (Only fetch existing data, no table creation)
// router.get("/sale-history", async (req, res) => {
//   try {
//     const { company_id, owner_type, owner_id } = req.query;
//     console.log('query', company_id, owner_type, owner_id)

//     if (!company_id || !owner_type || !owner_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required params",
//       });
//     }

//     const fetchSql = `
//       SELECT * FROM sale_history
//       WHERE companyId = ? AND ownerType = ? AND ownerId = ?
//       ORDER BY movementDate DESC, id DESC
//     `;

//     const [rows] = await db.execute(fetchSql, [
//       company_id,
//       owner_type,
//       owner_id,
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: rows,
//     });

//   } catch (error) {
//     console.error("🔥 Sale History Fetch Error:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });

router.get("/sale-history", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required params",
      });
    }

    const fetchSql = `
      SELECT 
        id,
        itemName,
        hsnCode,
        batchNumber,
        qtyChange,
        rate,
        movementDate,
        companyId,
        ownerType,
        ownerId
      FROM sale_history
      WHERE companyId = ? AND ownerType = ? AND ownerId = ?
      ORDER BY movementDate DESC, id DESC
    `;

    const [rows] = await db.execute(fetchSql, [
      company_id,
      owner_type,
      owner_id,
    ]);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("🔥 Sale History Fetch Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// get sales vouchers
router.get("/", async (req, res) => {
  const { owner_type, owner_id, company_id } = req.query;

  if (!owner_type || !owner_id) {
    return res.status(400).json({
      message: "owner_type & owner_id are required",
    });
  }

  try {
    let sql = `
      SELECT 
        id, number, date, partyId, referenceNo, supplierInvoiceDate,
        subtotal, cgstTotal, sgstTotal, igstTotal, discountTotal, total,
        salesLedgerId, company_id
      FROM sales_vouchers
      WHERE owner_type = ? AND owner_id = ?
    `;

    const params = [owner_type, owner_id];

    if (company_id) {
      sql += " AND company_id = ?";
      params.push(company_id);
    }

    sql += " ORDER BY id DESC";

    const [voucherRows] = await db.execute(sql, params);

    return res.status(200).json(voucherRows);
  } catch (err) {
    console.error("Failed to load sales vouchers:", err);
    return res.status(500).json({ message: err.message });
  }
});

//delete
router.delete("/:id", async (req, res) => {
  const voucherId = req.params.id;

  try {
    // 1️⃣ Delete items
    await db.execute(`DELETE FROM sales_voucher_items WHERE voucherId = ?`, [
      voucherId,
    ]);

    // 2️⃣ Delete ledger entries
    await db.execute(`DELETE FROM voucher_entries WHERE voucher_id = ?`, [
      voucherId,
    ]);

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
router.get("/:id", async (req, res) => {
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
    return res
      .status(500)
      .json({ message: err.message || "Something went wrong" });
  }
});

//single put
router.put("/:id", async (req, res) => {
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
    salesLedgerId,
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
        voucherId,
      ]
    );

    // ---- 2) DELETE OLD ITEM ROWS ----
    await db.execute(`DELETE FROM sales_voucher_items WHERE voucherId = ?`, [
      voucherId,
    ]);

    // ---- 3) INSERT NEW ITEM ROWS ----
    const itemEntries = entries.filter((e) => e.itemId);

    if (itemEntries.length > 0) {
      const itemValues = itemEntries.map((e) => [
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
        e.godownId,
      ]);

      await db.query(
        `INSERT INTO sales_voucher_items 
        (voucherId, itemId, quantity, rate, amount, cgstRate, sgstRate, igstRate, discount, hsnCode, batchNumber, godownId)
        VALUES ?`,
        [itemValues]
      );
    }

    // ---- 4) DELETE OLD LEDGER ENTRIES ----
    await db.execute(`DELETE FROM voucher_entries WHERE voucher_id = ?`, [
      voucherId,
    ]);

    // ---- 5) INSERT NEW LEDGER ENTRIES ----
    const ledgerEntries = entries.filter((e) => e.ledgerId);

    if (ledgerEntries.length > 0) {
      const ledgerValues = ledgerEntries.map((e) => [
        voucherId,
        e.ledgerId,
        e.amount,
        e.type,
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

//history maintain

router.post("/sale-history", async (req, res) => {
  try {
    const movementData = Array.isArray(req.body) ? req.body : [req.body];

    const createTableSql = `
      CREATE TABLE IF NOT EXISTS sale_history (
        id INT AUTO_INCREMENT PRIMARY KEY
      )
    `;
    await db.execute(createTableSql);

    const requiredColumns = [
      "itemName VARCHAR(255)",
      "hsnCode VARCHAR(50)",
      "batchNumber VARCHAR(255)",
      "qtyChange INT",
      "rate DECIMAL(10,2)",
      "movementDate DATE",
      "companyId VARCHAR(100)",
      "ownerType VARCHAR(50)",
      "ownerId VARCHAR(100)",
    ];

    for (const col of requiredColumns) {
      const columnName = col.split(" ")[0];

      const [rows] = await db.execute(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_NAME = 'sale_history' 
           AND COLUMN_NAME = ?`,
        [columnName]
      );

      if (rows.length === 0) {
        await db.execute(`ALTER TABLE sale_history ADD COLUMN ${col}`);
      }
    }

    // 3️⃣ Insert data
    const insertSql = `
      INSERT INTO sale_history 
      (itemName, hsnCode, batchNumber, qtyChange, rate, movementDate, companyId, ownerType, ownerId)
      VALUES ?
    `;

    const values = movementData.map((e) => [
      e.itemName,
      e.hsnCode || "",
      e.batchNumber || null,
      e.qtyChange || 0,
      e.rate || 0,
      e.movementDate,
      e.companyId,
      e.ownerType,
      e.ownerId,
    ]);

    // Auth safety check
    if (values.some((v) => !v[6] || !v[7] || !v[8])) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: company or owner missing",
      });
    }

    await db.query(insertSql, [values]);

    return res.status(200).json({
      success: true,
      message: "Sale history saved successfully",
    });
  } catch (error) {
    console.error("🔥 Sale history save failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
