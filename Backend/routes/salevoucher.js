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

// GET Item by Barcode
router.get("/item-by-barcode", async (req, res) => {
  const { barcode, company_id, owner_type, owner_id } = req.query;

  if (!barcode) {
    return res.status(400).json({ success: false, message: "Barcode is required" });
  }

  try {
    const query = `
      SELECT s.*, sg.name as stockGroupName, u.name as unitName
      FROM stock_items s
      LEFT JOIN stock_groups sg ON s.stockGroupId = sg.id
      LEFT JOIN stock_units u ON s.unit = u.id
      WHERE s.barcode = ? AND s.company_id = ? AND s.owner_type = ? AND s.owner_id = ?
    `;
    const [rows] = await db.execute(query, [
      barcode,
      company_id,
      owner_type,
      owner_id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found for this barcode",
      });
    }

    const item = rows[0];

    // Parse batches if they are stored as string
    if (item.batches && typeof item.batches === "string") {
      try {
        item.batches = JSON.parse(item.batches);
      } catch (e) {
        item.batches = [];
      }
    }

    res.json({ success: true, data: item });
  } catch (err) {
    console.error("Barcode lookup error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Sales Voucher
// 🔹 Helper: Clean State Name
const cleanState = (state = "") =>
  state.replace(/\(.*?\)/g, "").trim().toLowerCase();

// ================= AUTO CHECK COLUMN =================
async function ensureSalesLedgerColumn() {
  const [rows] = await db.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sales_voucher_items'
      AND COLUMN_NAME = 'salesLedgerId'
    `
  );

  if (rows.length === 0) {
    console.log("⚠️ salesLedgerId missing → creating...");

    await db.query(`
      ALTER TABLE sales_voucher_items
      ADD COLUMN salesLedgerId INT NULL
    `);

    console.log("✅ salesLedgerId column created");
  }
}

// ================= AUTO CHECK DISCOUNT LEDGER COLUMN =================
async function ensureDiscountLedgerColumn() {
  const [rows] = await db.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sales_voucher_items'
      AND COLUMN_NAME = 'discountLedgerId'
    `
  );

  if (rows.length === 0) {
    console.log("⚠️ discountLedgerId missing → creating...");

    await db.query(`
      ALTER TABLE sales_voucher_items
      ADD COLUMN discountLedgerId INT NULL
    `);

    console.log("✅ discountLedgerId column created");
  }
}

// ================= AUTO CHECK DISPATCH COLUMNS =================
async function ensureDispatchColumns() {
  const columns = [
    { name: "dispatchDocNo", type: "VARCHAR(100)" },
    { name: "dispatchThrough", type: "VARCHAR(100)" },
    { name: "destination", type: "VARCHAR(255)" },
    { name: "approxDistance", type: "VARCHAR(50)" },
  ];

  for (const col of columns) {
    const [rows] = await db.query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'sales_vouchers'
        AND COLUMN_NAME = ?
      `,
      [col.name]
    );

    if (rows.length === 0) {
      console.log(`⚠️ ${col.name} missing → creating...`);

      await db.query(`
        ALTER TABLE sales_vouchers
        ADD COLUMN ${col.name} ${col.type} NULL
      `);

      // console.log(`✅ ${col.name} column created`);
    }
  }
}

// ================= SAVE SALES VOUCHER =================
router.post("/", async (req, res) => {
  console.log("POST /sales-vouchers hit");

  try {
    // ✅ Ensure column exists first
    await ensureSalesLedgerColumn();
    await ensureDiscountLedgerColumn();
    await ensureDispatchColumns();

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

    // ================= AUTH =================
    if (!companyId || !ownerType || !ownerId) {
      return res.status(400).json({
        success: false,
        message: "companyId, ownerType & ownerId required",
      });
    }

    // ================= ENTRIES =================
    const receivedEntries = Array.isArray(entries)
      ? entries
      : Array.isArray(items)
        ? items
        : [];

    // ================= STATE =================
    let companyState = "";
    let partyState = "";

    const [companyRows] = await db.execute(
      "SELECT state FROM tbcompanies WHERE id=?",
      [companyId]
    );

    if (companyRows.length) companyState = companyRows[0].state || "";

    const [partyRows] = await db.execute(
      "SELECT state FROM ledgers WHERE id=?",
      [partyId]
    );

    if (partyRows.length) partyState = partyRows[0].state || "";

    const isIntra =
      cleanState(companyState) &&
      cleanState(partyState) &&
      cleanState(companyState) === cleanState(partyState);

    // ================= GST TOTAL FIX =================
    let finalCgst = Number(cgstTotal || 0);
    let finalSgst = Number(sgstTotal || 0);
    let finalIgst = Number(igstTotal || 0);

    if (isIntra) {
      finalIgst = 0;
    } else {
      finalCgst = 0;
      finalSgst = 0;
    }

    // ================= DISPATCH =================
    const dispatchDocNo = dispatchDetails?.docNo || null;
    const dispatchThrough = dispatchDetails?.through || null;
    const destination = dispatchDetails?.destination || null;
    const approxDistance = dispatchDetails?.approxDistance || null;

    // ================= INSERT VOUCHER =================
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
        approxDistance,
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
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
      approxDistance,
      subtotal ?? 0,

      finalCgst,
      finalSgst,
      finalIgst,

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

    const [voucherResult] = await db.execute(
      insertVoucherSQL,
      voucherValues
    );

    const voucherId = voucherResult.insertId;

    // ================= INSERT ITEMS =================
    const itemEntries = receivedEntries.filter((e) => e.itemId);

    if (itemEntries.length > 0) {
      const itemValues = itemEntries.map((e) => {
        if (isIntra) {
          return [
            voucherId,
            e.itemId,
            Number(e.quantity || 0),
            Number(e.rate || 0),
            Number(e.amount || 0),

            Number(e.cgstLedgerId || 0),
            Number(e.sgstLedgerId || 0),
            0,

            Number(e.discount || 0),
            e.hsnCode ?? "",
            e.batchNumber ?? "",
            e.godownId ?? null,

            Number(e.salesLedgerId || 0),
            Number(e.discountLedgerId || 0),
          ];
        }

        return [
          voucherId,
          e.itemId,
          Number(e.quantity || 0),
          Number(e.rate || 0),
          Number(e.amount || 0),

          0,
          0,
          Number(e.gstLedgerId || e.igstLedgerId || 0),

          Number(e.discount || 0),
          e.hsnCode ?? "",
          e.batchNumber ?? "",
          e.godownId ?? null,

          Number(e.salesLedgerId || 0),
          Number(e.discountLedgerId || 0),
        ];
      });

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
          godownId,
          salesLedgerId,
          discountLedgerId
        )
        VALUES ?
        `,
        [itemValues]
      );
    }

    // ================= DONE =================
    return res.status(200).json({
      success: true,
      message: "Sales voucher saved successfully",
      id: voucherId,
      gstType: isIntra ? "INTRA" : "INTER",
    });
  } catch (err) {
    console.error("❌ Sales voucher save failed:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
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
    sh.id,
    sh.itemName,
    sh.hsnCode,
    sh.batchNumber,
    sh.qtyChange,
    sh.rate,
    sh.movementDate,
    sh.godownId,
    sh.voucherNumber,
    sh.companyId,
    sh.ownerType,
    sh.ownerId,

    sv.partyId AS partyId,
    l.name     AS partyName

  FROM sale_history sh

  LEFT JOIN sales_vouchers sv
    ON sv.number COLLATE utf8mb4_general_ci
     = sh.voucherNumber COLLATE utf8mb4_general_ci
    AND sv.company_id = ?
    AND sv.owner_type = ?
    AND sv.owner_id = ?

  LEFT JOIN ledgers l
    ON l.id = sv.partyId

  WHERE sh.companyId = ?
    AND sh.ownerType = ?
    AND sh.ownerId = ?

  ORDER BY sh.movementDate DESC, sh.id DESC
`;

    const [rows] = await db.execute(fetchSql, [
      company_id,
      owner_type,
      owner_id,
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

// ===============================
// GET SINGLE SALES VOUCHER (EDIT MODE WITH HISTORY)
// ===============================

router.get("/:id", async (req, res) => {
  try {
    const voucherId = req.params.id;

    /* ======================
       1️⃣ GET VOUCHER
    ====================== */
    const [voucherRows] = await db.execute(
      `SELECT * FROM sales_vouchers WHERE id = ?`,
      [voucherId]
    );

    if (!voucherRows.length) {
      return res.status(404).json({
        success: false,
        message: "Voucher not found",
      });
    }

    const voucher = voucherRows[0];

    /* ======================
       2️⃣ GET ITEMS
    ====================== */
    const [items] = await db.execute(
      `
      SELECT *
      FROM sales_voucher_items
      WHERE voucherId = ?
      `,
      [voucherId]
    );

    /* ======================
       3️⃣ GET SALE HISTORY (BY VOUCHER NUMBER)
    ====================== */
    const [history] = await db.execute(
      `
      SELECT *
      FROM sale_history
      WHERE voucherNumber = ?
      `,
      [voucher.number]
    );

    /* ======================
       4️⃣ MERGE ITEMS + HISTORY
       (MATCH BY GODOWN)
    ====================== */

    const entries = items.map((item) => {

      // 🔥 Same logic as purchase
      const historyRow = history.find(
        (h) =>
          String(h.godownId) === String(item.godownId)
      );

      return {
        id: item.id,

        itemId: item.itemId,

        quantity: item.quantity,
        rate: item.rate,
        discount: item.discount,
        amount: item.amount,

        cgstRate: item.cgstRate,
        sgstRate: item.sgstRate,
        igstRate: item.igstRate,

        godownId: item.godownId,
        godownId: item.godownId,
        salesLedgerId: item.salesLedgerId,
        discountLedgerId: item.discountLedgerId,

        // 🔥 FROM HISTORY
        batchNumber: historyRow?.batchNumber || "",
        hsnCode: historyRow?.hsnCode || "",
        movementDate: historyRow?.movementDate || voucher.date,
      };
    });



    /* ======================
       5️⃣ SEND RESPONSE
    ====================== */

    return res.json({
      success: true,

      id: voucher.id,

      number: voucher.number,
      date: voucher.date,

      narration: voucher.narration,
      partyId: voucher.partyId,
      referenceNo: voucher.referenceNo,

      dispatchDocNo: voucher.dispatchDocNo,
      dispatchThrough: voucher.dispatchThrough,
      destination: voucher.destination,

      salesLedgerId: voucher.salesLedgerId,

      subtotal: voucher.subtotal,
      cgstTotal: voucher.cgstTotal,
      sgstTotal: voucher.sgstTotal,
      igstTotal: voucher.igstTotal,

      discountTotal: voucher.discountTotal,
      total: voucher.total,

      profit: voucher.profit,

      billNo: voucher.bill_no,
      approxDistance: voucher.approxDistance,

      isQuotation: voucher.isQuotation,

      supplierInvoiceDate: voucher.supplierInvoiceDate,
      sales_type_id: voucher.sales_type_id,

      // ⭐ MAIN DATA
      entries,
    });

  } catch (err) {
    console.error("🔥 Fetch sales edit voucher error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});



//single put
router.put("/:id", async (req, res) => {
  const voucherId = req.params.id;

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
    await ensureSalesLedgerColumn();
    await ensureDiscountLedgerColumn();
    await ensureDispatchColumns();

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
        Number(e.quantity || 0),
        Number(e.rate || 0),
        Number(e.amount || 0),
        Number(e.cgstLedgerId || e.cgstRate || 0),
        Number(e.sgstLedgerId || e.sgstRate || 0),
        Number(e.igstLedgerId || e.igstRate || e.gstLedgerId || 0),
        Number(e.discount || 0),
        e.hsnCode || "",
        e.batchNumber || "",
        e.godownId || null,
        Number(e.salesLedgerId || 0),
        Number(e.discountLedgerId || 0),
      ]);

      await db.query(
        `INSERT INTO sales_voucher_items 
        (voucherId, itemId, quantity, rate, amount, cgstRate, sgstRate, igstRate, discount, hsnCode, batchNumber, godownId, salesLedgerId, discountLedgerId)
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
        Number(e.amount || 0),
        e.type || "debit",
      ]);

      await db.query(
        `INSERT INTO voucher_entries (voucher_id, ledger_id, amount, entry_type)
         VALUES ?`,
        [ledgerValues]
      );
    }

    // ---- 6) CLEAR OLD HISTORY (The frontend will POST new history) ----
    await db.execute(`DELETE FROM sale_history WHERE voucherNumber = ?`, [number]);

    return res.json({ success: true, message: "Voucher updated successfully" });
  } catch (err) {
    console.error("❌ Update failed:", err);
    return res.status(500).json({ success: false, message: err.message || "Update failed" });
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
