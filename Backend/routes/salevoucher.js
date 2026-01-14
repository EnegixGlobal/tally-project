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
      sales_type_id,
      bill_no,
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

    // ================= CHECK & ADD COLUMNS IF MISSING =================
    try {
      // Check if sales_type_id column exists
      const [salesTypeIdCheck] = await db.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sales_vouchers'
           AND COLUMN_NAME = 'sales_type_id'`
      );

      if (salesTypeIdCheck.length === 0) {
        await db.execute(
          `ALTER TABLE sales_vouchers ADD COLUMN sales_type_id INT NULL`
        );
        console.log("✅ Added sales_type_id column to sales_vouchers");
      }

      // Check if bill_no column exists
      const [billNoCheck] = await db.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sales_vouchers'
           AND COLUMN_NAME = 'bill_no'`
      );

      if (billNoCheck.length === 0) {
        await db.execute(
          `ALTER TABLE sales_vouchers ADD COLUMN bill_no VARCHAR(100) NULL`
        );
        console.log("✅ Added bill_no column to sales_vouchers");
      }
    } catch (colErr) {
      console.error("Column check/add error (non-fatal):", colErr);
      // Continue even if column check fails
    }

    // ================= AUTO-INCREMENT current_no IN sales_types =================
    if (sales_type_id) {
      try {
        await db.execute(
          `UPDATE sales_types SET current_no = current_no + 1 WHERE id = ?`,
          [sales_type_id]
        );
        console.log(
          `✅ Incremented current_no for sales_type_id: ${sales_type_id}`
        );
      } catch (incErr) {
        console.error("Error incrementing current_no:", incErr);
        // Continue even if increment fails
      }
    }

    // 🚫 PROFIT COMPLETELY REMOVED
    // Always include sales_type_id and bill_no columns (they'll be added if missing)
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
        owner_id,
        sales_type_id,
        bill_no
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      sales_type_id ?? null,
      bill_no ?? null,
    ];

    const [voucherResult] = await db.execute(insertVoucherSQL, voucherValues);

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
        godownId,
        voucherNumber,
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
  const { owner_type, owner_id, company_id, isQuotation } = req.query;

  if (!owner_type || !owner_id) {
    return res.status(400).json({
      message: "owner_type & owner_id are required",
    });
  }

  try {
    let sql = `
      SELECT 
        id, number, date, narration, partyId, referenceNo, dispatchDocNo,
        dispatchThrough, destination, subtotal, cgstTotal, sgstTotal,
        igstTotal, discountTotal, total, createdAt, company_id, owner_type,
        owner_id, type, isQuotation, salesLedgerId, supplierInvoiceDate,
        sales_type_id, bill_no
      FROM sales_vouchers
      WHERE owner_type = ? AND owner_id = ?
    `;

    const params = [owner_type, owner_id];

    if (company_id) {
      sql += " AND company_id = ?";
      params.push(company_id);
    }

    // Filter by isQuotation if provided
    if (isQuotation !== undefined) {
      sql += " AND isQuotation = ?";
      params.push(isQuotation === "true" || isQuotation === "1" ? 1 : 0);
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
    // 1️⃣ voucher number nikaalo
    const [[row]] = await db.execute(
      "SELECT number FROM sales_vouchers WHERE id = ?",
      [voucherId]
    );

    if (!row) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const voucherNumber = row.number;

    // 2️⃣ sales_history se delete (✨ यही extra line है)
    await db.execute("DELETE FROM sale_history WHERE voucherNumber = ?", [
      voucherNumber,
    ]);

    // 3️⃣ voucher related tables
    await db.execute("DELETE FROM sales_voucher_items WHERE voucherId = ?", [
      voucherId,
    ]);

    await db.execute("DELETE FROM voucher_entries WHERE voucher_id = ?", [
      voucherId,
    ]);

    // 4️⃣ main voucher delete
    await db.execute("DELETE FROM sales_vouchers WHERE id = ?", [voucherId]);

    return res.json({
      message: "Sales voucher deleted successfully",
    });
  } catch (err) {
    console.error("Delete failed:", err);
    return res.status(500).json({ message: err.message });
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
    sales_type_id,
    bill_no,
  } = req.body;

  try {
    // ================= CHECK & ADD COLUMNS IF MISSING (for UPDATE route too) =================
    try {
      const [salesTypeIdCheck] = await db.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sales_vouchers'
           AND COLUMN_NAME = 'sales_type_id'`
      );

      if (salesTypeIdCheck.length === 0) {
        await db.execute(
          `ALTER TABLE sales_vouchers ADD COLUMN sales_type_id INT NULL`
        );
      }

      const [billNoCheck] = await db.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sales_vouchers'
           AND COLUMN_NAME = 'bill_no'`
      );

      if (billNoCheck.length === 0) {
        await db.execute(
          `ALTER TABLE sales_vouchers ADD COLUMN bill_no VARCHAR(100) NULL`
        );
      }
    } catch (colErr) {
      console.error("Column check/add error (non-fatal):", colErr);
    }

    // ---- 1) UPDATE MAIN TABLE ----
    // Always include sales_type_id and bill_no (columns will be added if missing)
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
         salesLedgerId = ?,
         sales_type_id = ?,
         bill_no = ?
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
        sales_type_id ?? null,
        bill_no ?? null,
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
    // 1️⃣ Normalize input (single OR array)
    const movementData = Array.isArray(req.body) ? req.body : [req.body];

    /* =====================================================
       2️⃣ CREATE TABLE IF NOT EXISTS (MINIMAL)
    ===================================================== */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sale_history (
        id INT AUTO_INCREMENT PRIMARY KEY
      )
    `);

    /* =====================================================
       3️⃣ REQUIRED COLUMNS (AUTO-MIGRATION)
    ===================================================== */
    const requiredColumns = {
      itemName: "VARCHAR(255)",
      hsnCode: "VARCHAR(50)",
      batchNumber: "VARCHAR(255)",
      qtyChange: "INT",
      rate: "DECIMAL(10,2)",
      movementDate: "DATE",
      voucherNumber: "VARCHAR(100)",
      godownId: "INT",
      companyId: "VARCHAR(100)",
      ownerType: "VARCHAR(50)",
      ownerId: "VARCHAR(100)",
    };

    /* =====================================================
       4️⃣ CHECK & ADD MISSING COLUMNS
    ===================================================== */
    for (const [col, def] of Object.entries(requiredColumns)) {
      const [rows] = await db.execute(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'sale_history'
          AND COLUMN_NAME = ?
        `,
        [col]
      );

      if (rows.length === 0) {
        await db.execute(`ALTER TABLE sale_history ADD COLUMN ${col} ${def}`);
      }
    }

    /* =====================================================
       5️⃣ INSERT QUERY (ORDER MATTERS)
    ===================================================== */
    const insertSql = `
      INSERT INTO sale_history
      (
        itemName,
        hsnCode,
        batchNumber,
        qtyChange,
        rate,
        movementDate,
        voucherNumber,
        godownId,
        companyId,
        ownerType,
        ownerId
      )
      VALUES ?
    `;

    const values = movementData.map((e) => [
      e.itemName || null,
      e.hsnCode || "",
      e.batchNumber || null,
      Number(e.qtyChange) || 0,
      Number(e.rate) || 0,
      e.movementDate || null,
      e.voucherNumber || null,

      // ✅ SAVE ONLY GODOWN ID
      e.godownId ? Number(e.godownId) : null,

      e.companyId || null,
      e.ownerType || null,
      e.ownerId || null,
    ]);

    /* =====================================================
       6️⃣ TENANT SECURITY CHECK
    ===================================================== */
    if (values.some((v) => !v[8] || !v[9] || !v[10])) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: company or owner missing",
      });
    }

    /* =====================================================
       7️⃣ EXECUTE INSERT
    ===================================================== */
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
