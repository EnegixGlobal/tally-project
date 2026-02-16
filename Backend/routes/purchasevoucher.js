const express = require("express");
const router = express.Router();
const db = require("../db");
const { generateVoucherNumber } = require('../utils/generateVoucherNumber')
const { getFinancialYear } = require("../utils/financialYear");


//purchase history
router.get("/purchase-history", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: company or owner missing",
      });
    }

    // 🔍 Column check
    const existingColsQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'purchase_history'
    `;
    const [colsRows] = await db.execute(existingColsQuery);
    const existingCols = colsRows.map((r) => r.COLUMN_NAME);

    // 🏗️ Create table if not exists
    if (existingCols.length === 0) {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS purchase_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          itemName VARCHAR(255),
          hsnCode VARCHAR(50),
          batchNumber VARCHAR(255),
          purchaseQuantity INT,
          purchaseDate DATE,
          companyId VARCHAR(100),
          ownerType VARCHAR(50),
          ownerId VARCHAR(100),
          type VARCHAR(50) DEFAULT 'purchase',
          rate DECIMAL(10,2),
          voucherNumber VARCHAR(100),
          godownId INT,
          mrp DECIMAL(10,2)
        )
      `);
    } else if (!existingCols.includes("type")) {
      await db.execute(`
        ALTER TABLE purchase_history 
        ADD COLUMN type VARCHAR(50) DEFAULT 'purchase'
      `);
    }

    // ✅ FINAL QUERY WITH LEDGER NAME
    const selectSql = `
      SELECT 
        ph.id,
        ph.itemName,
        ph.hsnCode,
        ph.batchNumber,
        ph.purchaseQuantity,
        ph.rate,
        ph.purchaseDate,
        ph.voucherNumber,
        ph.godownId,
        ph.companyId,
        ph.ownerType,
        ph.ownerId,
        ph.type,

        -- 🎯 LEDGER RESULT
        l.id   AS ledgerId,
        l.name AS ledgerName

      FROM purchase_history ph

      -- 🔗 purchase_history → purchase_vouchers
      LEFT JOIN purchase_vouchers pv
        ON pv.number = ph.voucherNumber
        AND pv.company_id = ?
        AND pv.owner_type = ?
        AND pv.owner_id = ?

      -- 🔗 purchase_vouchers → purchase_voucher_items
      LEFT JOIN purchase_voucher_items pvi
        ON pvi.voucherId = pv.id

      -- 🔗 purchase_voucher_items → ledgers
      LEFT JOIN ledgers l
        ON l.id = pvi.purchaseLedgerId

      WHERE ph.companyId = ?
        AND ph.ownerType = ?
        AND ph.ownerId = ?

      ORDER BY ph.purchaseDate DESC, ph.id DESC
    `;

    const [rows] = await db.execute(selectSql, [
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
    console.error("🔥 Fetch purchase history failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});




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

// next voucher count
router.get("/next-number", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, voucherType, date } = req.query;
    console.log("hit hua baba");

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ success: false });
    }

    const fy = getFinancialYear(date);
    const month = String(new Date(date).getMonth() + 1).padStart(2, "0");

    // 🔥 LAST VOUCHER FETCH
    const [rows] = await db.execute(
      `SELECT number FROM purchase_vouchers
       WHERE company_id=? AND owner_type=? AND owner_id=?
         AND number LIKE ?
       ORDER BY id DESC
       LIMIT 1`,
      [
        company_id,
        owner_type,
        owner_id,
        `${voucherType}/${fy}/${month}/%`
      ]
    );

    let nextNo = 1;

    if (rows.length > 0) {
      const lastNumber = rows[0].number; // PRV/25-26/01/000001
      const lastSeq = Number(lastNumber.split("/").pop());
      nextNo = lastSeq + 1;
    }

    const voucherNumber =
      `${voucherType}/${fy}/${month}/${String(nextNo).padStart(6, "0")}`;

    console.log("voucherNumber:", voucherNumber);

    // ✅ Create TDS columns if they don't exist
    await ensureTDSColumns();

    return res.json({
      success: true,
      voucherNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


// POST Purchase Voucher
// Helper
// ================= UTILS =================

const cleanState = (state = "") =>
  state.replace(/\(.*?\)/g, "").trim().toLowerCase();


// ✅ AUTO CREATE COLUMN (RUNS ON EVERY HIT – SAFE)
let isPurchaseLedgerChecked = false;


const ensurePurchaseLedgerColumn = async () => {
  if (isPurchaseLedgerChecked) return;


  const [rows] = await db.execute(`
SHOW COLUMNS
FROM purchase_voucher_items
LIKE 'purchaseLedgerId'
`);


  if (rows.length === 0) {
    console.log("⚙️ Creating purchaseLedgerId column...");


    await db.execute(`
ALTER TABLE purchase_voucher_items
ADD COLUMN purchaseLedgerId INT NULL
`);


    console.log("✅ purchaseLedgerId column created");
  }


  isPurchaseLedgerChecked = true;
};

// ✅ AUTO CREATE TDS COLUMNS
let isTDSChecked = false;
const ensureTDSColumns = async () => {
  if (isTDSChecked) return;

  // 1️⃣ purchase_voucher_items -> tdsRate
  const [itemRows] = await db.execute(`
    SHOW COLUMNS FROM purchase_voucher_items LIKE 'tdsRate'
  `);
  if (itemRows.length === 0) {
    await db.execute(`
      ALTER TABLE purchase_voucher_items ADD COLUMN tdsRate DECIMAL(10,2) DEFAULT 0
    `);
    console.log("✅ tdsRate column created in purchase_voucher_items");
  }

  // 2️⃣ purchase_vouchers -> tdsTotal
  const [voucherRows] = await db.execute(`
    SHOW COLUMNS FROM purchase_vouchers LIKE 'tdsTotal'
  `);
  if (voucherRows.length === 0) {
    await db.execute(`
      ALTER TABLE purchase_vouchers ADD COLUMN tdsTotal DECIMAL(10,2) DEFAULT 0
    `);
    console.log("✅ tdsTotal column created in purchase_vouchers");
  }

  isTDSChecked = true;
};



// ================= ROUTE =================

router.post("/", async (req, res) => {
  const {
    date,
    narration,
    partyId,
    referenceNo,
    supplierInvoiceDate,
    dispatchDetails,
    subtotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    discountTotal,
    tdsTotal,
    total,
    entries = [],
    mode,
    purchaseLedgerId, // header
    companyId,
    ownerType,
    ownerId,
  } = req.body;


  // ================= QUERY FALLBACK =================

  const finalCompanyId = companyId || req.query.company_id;
  const finalOwnerType = ownerType || req.query.owner_type;
  const finalOwnerId = ownerId || req.query.owner_id;

  // ================= AUTH =================

  if (!finalCompanyId || !finalOwnerType || !finalOwnerId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    // ================= FETCH STATES =================
    await ensurePurchaseLedgerColumn();
    await ensureTDSColumns();

    let companyState = "";
    let partyState = "";

    const [companyRows] = await db.execute(
      "SELECT state FROM tbcompanies WHERE id=?",
      [finalCompanyId]
    );

    if (companyRows.length) {
      companyState = companyRows[0].state || "";
    }

    const [partyRows] = await db.execute(
      "SELECT state FROM ledgers WHERE id=?",
      [partyId]
    );

    if (partyRows.length) {
      partyState = partyRows[0].state || "";
    }

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

    // ================= FINAL TOTAL FIX =================


    let finalTotal;
    if (total !== undefined && total !== null) {
      finalTotal = Number(total);
    } else {
      finalTotal =
        Number(subtotal || 0) +
        Number(finalCgst || 0) +
        Number(finalSgst || 0) +
        Number(finalIgst || 0) -
        Number(discountTotal || 0) +
        Number(tdsTotal || 0);
    }


    // ================= DISPATCH =================

    const dispatchDocNo = dispatchDetails?.docNo || null;
    const dispatchThrough = dispatchDetails?.through || null;
    const destination = dispatchDetails?.destination || null;

    // ================= GENERATE NUMBER =================

    const voucherNumber = await generateVoucherNumber({
      companyId: finalCompanyId,
      ownerType: finalOwnerType,
      ownerId: finalOwnerId,
      voucherType: "PRV",
      date,
    });

    // ================= VALIDATION =================

    if (mode !== "item-invoice") {
      return res.status(400).json({
        success: false,
        message: "Invalid mode",
      });
    }

    if (!entries.length) {
      return res.status(400).json({
        success: false,
        message: "No items found",
      });
    }

    // ================= INSERT VOUCHER =================

    const insertVoucherSql = `
      INSERT INTO purchase_vouchers (
        number,
        date,
        supplierInvoiceDate,
        narration,
        partyId,
        referenceNo,
        dispatchDocNo,
        dispatchThrough,
        destination,
        purchaseLedgerId,
        subtotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        discountTotal,
        tdsTotal,
        total,
        company_id,
        owner_type,
        owner_id
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const insertVoucherValues = [
      voucherNumber,
      date || null,
      supplierInvoiceDate || null,
      narration || null,
      partyId || null,
      referenceNo || null,

      dispatchDocNo || null,
      dispatchThrough || null,
      destination || null,

      purchaseLedgerId || null,

      subtotal || 0,
      finalCgst,
      finalSgst,
      finalIgst,
      discountTotal || 0,
      tdsTotal || 0,
      finalTotal,

      finalCompanyId,
      finalOwnerType,
      finalOwnerId,
    ];

    const [voucherResult] = await db.execute(
      insertVoucherSql,
      insertVoucherValues
    );

    const voucherId = voucherResult.insertId;

    // ================= INSERT ITEMS =================

    const validItems = entries.filter((e) => e.itemId);

    if (!validItems.length) {
      return res.status(400).json({
        success: false,
        message: "No valid items",
      });
    }

    const insertItemSql = `
      INSERT INTO purchase_voucher_items (
        voucherId,
        itemId,
        quantity,
        rate,
        discount,
        cgstRate,
        sgstRate,
        igstRate,
        amount,
        tdsRate,
        godownId,
        purchaseLedgerId
      ) VALUES ?
    `;

    // 🔥 MAIN FIX: LEDGER ID SAVE IN GST COLUMNS

    const itemValues = validItems.map((e) => {

      // ================= INTRA =================
      if (isIntra) {
        return [
          voucherId,

          e.itemId,
          Number(e.quantity || 0),
          Number(e.rate || 0),
          Number(e.discount || 0),

          // ✅ LEDGER ID
          Number(e.cgstLedgerId || 0),
          Number(e.sgstLedgerId || 0),
          0,

          Number(e.amount || 0),
          Number(e.tdsRate || 0),
          e.godownId || null,

          e.purchaseLedgerId || purchaseLedgerId || null,
        ];
      }

      // ================= INTER =================
      return [
        voucherId,

        e.itemId,
        Number(e.quantity || 0),
        Number(e.rate || 0),
        Number(e.discount || 0),

        0,
        0,

        // ✅ IGST LEDGER ID
        Number(e.gstLedgerId || 0),

        Number(e.amount || 0),
        Number(e.tdsRate || 0),
        e.godownId || null,

        e.purchaseLedgerId || purchaseLedgerId || null,
      ];
    });

    await db.query(insertItemSql, [itemValues]);

    // ================= SUCCESS =================

    return res.status(200).json({
      success: true,
      voucherId,
      voucherNumber,
      gstType: isIntra ? "INTRA" : "INTER",
      message: "Purchase voucher saved successfully",
    });

  } catch (err) {
    console.error("🔥 Purchase voucher error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});




// get ourchase vouncher
router.get("/", async (req, res) => {
  try {
    const finalCompanyId = req.query.company_id || req.body?.companyId;
    const finalOwnerType = req.query.owner_type || req.body?.ownerType;
    const finalOwnerId = req.query.owner_id || req.body?.ownerId;

    if (!finalCompanyId || !finalOwnerType || !finalOwnerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const [rows] = await db.execute(
      `SELECT *
       FROM purchase_vouchers
       WHERE company_id = ?
         AND owner_type = ?
         AND owner_id = ?
       ORDER BY date DESC`,
      [finalCompanyId, finalOwnerType, finalOwnerId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Month-wise purchase vouchers with optional date filtering
router.get("/month-wise", async (req, res) => {
  const { owner_type, owner_id, company_id, month, year, fromDate, toDate } = req.query;

  if (!owner_type || !owner_id) {
    return res.status(400).json({
      success: false,
      message: "owner_type & owner_id are required",
    });
  }

  try {
    let sql = `
      SELECT 
        id,
        number,
        date,
        partyId,
        referenceNo,
        supplierInvoiceDate,
        subtotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        discountTotal,
        total,
        purchaseLedgerId,
        company_id
      FROM purchase_vouchers
      WHERE owner_type = ?
        AND owner_id = ?
    `;

    const params = [owner_type, owner_id];

    // Date range filter (takes priority over month/year)
    if (fromDate && toDate) {
      // Use DATE() function to ensure proper date comparison and include entire toDate
      sql += " AND DATE(date) >= DATE(?) AND DATE(date) <= DATE(?)";
      params.push(fromDate, toDate);
    } else if (month && year) {
      // Fallback to month/year filter if date range not provided
      const monthMap = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
      };

      const monthNumber = monthMap[month];

      if (!monthNumber) {
        return res.status(400).json({
          success: false,
          message: "Invalid month name",
        });
      }

      sql += " AND MONTH(date) = ? AND YEAR(date) = ?";
      params.push(monthNumber, year);
    }

    // optional company filter
    if (company_id) {
      sql += " AND company_id = ?";
      params.push(company_id);
    }

    sql += " ORDER BY date DESC";

    const [rows] = await db.execute(sql, params);

    return res.status(200).json({
      success: true,
      month: month || null,
      year: year || null,
      fromDate: fromDate || null,
      toDate: toDate || null,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("Month-wise purchase error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load month-wise purchases",
    });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  console.log('this is id', id)
  try {
    // 1️⃣ voucher number nikaalo
    const [rows] = await db.execute(
      "SELECT number FROM purchase_vouchers WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Voucher not found",
      });
    }

    const voucherNumber = rows[0].number;

    // 2️⃣ child tables delete
    await db.execute("DELETE FROM voucher_entries WHERE voucher_id = ?", [id]);
    await db.execute("DELETE FROM purchase_voucher_items WHERE voucherId = ?", [
      id,
    ]);

    // 3️⃣ purchase history delete
    await db.execute("DELETE FROM purchase_history WHERE voucherNumber = ?", [
      voucherNumber,
    ]);

    // 4️⃣ main voucher delete
    await db.execute("DELETE FROM purchase_vouchers WHERE id = ?", [id]);

    // ✅ IMPORTANT RESPONSE
    return res.json({
      success: true,
      message: "Purchase voucher deleted successfully",
    });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete voucher",
    });
  }
});

//single GET
// ===============================
// GET PURCHASE VOUCHER WITH ITEMS + HISTORY
// ===============================

router.get("/:id", async (req, res) => {
  try {
    const voucherId = req.params.id;

    /* ======================
       1️⃣ GET VOUCHER
    ====================== */

    const [voucherRows] = await db.execute(
      `SELECT * FROM purchase_vouchers WHERE id = ?`,
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
      FROM purchase_voucher_items
      WHERE voucherId = ?
      `,
      [voucherId]
    );

    // 🔍 Fallback: If tdsLedgerId is missing in main row, try to get it from first item
    // ⚠️ tdsRate column might be DECIMAL(10,2), so we must parse it to INT to match matches frontend ID
    let fallbackTdsId = items.find(i => Number(i.tdsRate) > 0)?.tdsRate;
    if (fallbackTdsId) fallbackTdsId = Math.round(Number(fallbackTdsId));

    const tdsLedgerId = voucher.tdsLedgerId || fallbackTdsId || null;

    /* ======================
       3️⃣ GET HISTORY (BY VOUCHER NUMBER)
    ====================== */

    const [history] = await db.execute(
      `
      SELECT *
      FROM purchase_history
      WHERE voucherNumber = ?
      `,
      [voucher.number]
    );

    /* ======================
       4️⃣ MAP HISTORY BY ITEM NAME
    ====================== */

    const historyMap = {};

    history.forEach((h) => {
      if (h.itemName) {
        historyMap[h.itemName.trim().toLowerCase()] = h;
      }
    });

    /* ======================
       5️⃣ MERGE ITEMS + HISTORY
    ====================== */

    const entries = items.map((item) => {

      // ⚠️ match via itemName (only way in current DB)
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
        purchaseLedgerId: item.purchaseLedgerId,
        tdsRate: item.tdsRate, // ✅ Added

        // 🔥 FROM HISTORY
        batchNumber: historyRow?.batchNumber || "",
        hsnCode: historyRow?.hsnCode || "",
        purchaseDate: historyRow?.purchaseDate || voucher.date,
      };
    });

    console.log('subtotal: voucher.subtotal', voucher.subtotal,
      voucher.cgstTotal,
      voucher.sgstTotal,
      voucher.igstTotal)

    /* ======================
       6️⃣ SEND RESPONSE
    ====================== */

    return res.json({
      id: voucher.id,

      number: voucher.number,
      date: voucher.date,
      supplierInvoiceDate: voucher.supplierInvoiceDate,

      narration: voucher.narration,
      partyId: voucher.partyId,
      referenceNo: voucher.referenceNo,

      dispatchDocNo: voucher.dispatchDocNo,
      dispatchThrough: voucher.dispatchThrough,
      destination: voucher.destination,

      purchaseLedgerId: voucher.purchaseLedgerId,

      subtotal: voucher.subtotal,
      cgstTotal: voucher.cgstTotal,
      sgstTotal: voucher.sgstTotal,
      igstTotal: voucher.igstTotal,
      discountTotal: voucher.discountTotal,
      tdsTotal: voucher.tdsTotal, // ✅ Added
      tdsLedgerId: tdsLedgerId, // ✅ Use the calculated variable with fallback
      total: voucher.total,

      // ⭐ MAIN
      entries,
    });

  } catch (err) {
    console.error("🔥 Fetch edit voucher error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});


//put code
// UPDATE PURCHASE VOUCHER

router.put("/:id", async (req, res) => {
  const voucherId = req.params.id;

  const {
    number,
    date,
    narration,
    partyId,
    referenceNo,
    supplierInvoiceDate,
    dispatchDetails,
    subtotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    discountTotal,
    tdsTotal,
    total,
    entries = [],
    mode,
    purchaseLedgerId,
    companyId,
    ownerType,
    ownerId,
  } = req.body;

  // Allow values from query string too
  const finalCompanyId = companyId || req.query.company_id;
  const finalOwnerType = ownerType || req.query.owner_type;
  const finalOwnerId = ownerId || req.query.owner_id;

  // 🔐 Security: Must have all auth fields
  if (!finalCompanyId || !finalOwnerType || !finalOwnerId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing company or owner info",
    });
  }

  try {
    // 🔍 Fetch voucher first
    const [voucherRows] = await db.execute(
      "SELECT company_id, owner_type, owner_id FROM purchase_vouchers WHERE id = ?",
      [voucherId]
    );

    if (voucherRows.length === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const existing = voucherRows[0];

    // ⭐ AUTO FIX OLD VOUCHERS (null company fields)
    if (!existing.company_id || !existing.owner_type || !existing.owner_id) {
      await db.execute(
        "UPDATE purchase_vouchers SET company_id = ?, owner_type = ?, owner_id = ? WHERE id = ?",
        [finalCompanyId, finalOwnerType, finalOwnerId, voucherId]
      );
    } else {
      // 🚫 Block other company's update attempt
      if (
        existing.company_id != finalCompanyId ||
        existing.owner_type != finalOwnerType ||
        existing.owner_id != finalOwnerId
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to update this voucher!",
        });
      }
    }

    // ================= STATES & GST LOGIC (COPIED FROM POST) =================
    await ensurePurchaseLedgerColumn();
    await ensureTDSColumns();

    let companyState = "";
    let partyState = "";

    const [companyRows] = await db.execute(
      "SELECT state FROM tbcompanies WHERE id=?",
      [finalCompanyId]
    );

    if (companyRows.length) {
      companyState = companyRows[0].state || "";
    }

    const [partyRows] = await db.execute(
      "SELECT state FROM ledgers WHERE id=?",
      [partyId]
    );

    if (partyRows.length) {
      partyState = partyRows[0].state || "";
    }

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

    // ================= FINAL TOTAL FIX =================
    // ================= FINAL TOTAL FIX =================
    let finalTotal;
    if (total !== undefined && total !== null) {
      finalTotal = Number(total);
    } else {
      finalTotal =
        Number(subtotal || 0) +
        Number(finalCgst || 0) +
        Number(finalSgst || 0) +
        Number(finalIgst || 0) -
        Number(discountTotal || 0) +
        Number(tdsTotal || 0);
    }

    // =====================================================================

    const dispatchDocNo = dispatchDetails?.docNo || null;
    const dispatchThrough = dispatchDetails?.through || null;
    const destination = dispatchDetails?.destination || null;

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
        tdsTotal = ?,
        total = ?,
        company_id = ?,
        owner_type = ?,
        owner_id = ?
      WHERE id = ?
    `;

    await db.execute(updateSql, [
      number || null,
      date || null,
      supplierInvoiceDate || null,
      narration || null,
      partyId || null,
      referenceNo || null,
      dispatchDocNo || null,
      dispatchThrough || null,
      destination || null,
      purchaseLedgerId || null,
      subtotal || 0,
      finalCgst,
      finalSgst,
      finalIgst,
      discountTotal || 0,
      tdsTotal || 0,
      finalTotal,
      finalCompanyId,
      finalOwnerType,
      finalOwnerId,
      voucherId,
    ]);

    // ================= UPDATE ITEMS (DELETE OLD + INSERT NEW) =================

    // 1️⃣ Delete old items
    await db.execute("DELETE FROM purchase_voucher_items WHERE voucherId = ?", [
      voucherId,
    ]);

    // 2️⃣ Insert new items (if any)
    const validItems = entries.filter((e) => e.itemId);

    if (validItems.length > 0) {
      const insertItemSql = `
        INSERT INTO purchase_voucher_items (
          voucherId,
          itemId,
          quantity,
          rate,
          discount,
          cgstRate,
          sgstRate,
          igstRate,
          amount,
          tdsRate,
          godownId,
          purchaseLedgerId
        ) VALUES ?
      `;

      const itemValues = validItems.map((e) => {
        if (isIntra) {
          return [
            voucherId,
            e.itemId,
            Number(e.quantity || 0),
            Number(e.rate || 0),
            Number(e.discount || 0),
            // ✅ LEDGER ID (Saved in rate columns as per POST logic)
            Number(e.cgstLedgerId || 0),
            Number(e.sgstLedgerId || 0),
            0,
            Number(e.amount || 0),
            Number(e.tdsRate || 0),
            e.godownId || null,
            e.purchaseLedgerId || purchaseLedgerId || null,
          ];
        }

        // INTER
        return [
          voucherId,
          e.itemId,
          Number(e.quantity || 0),
          Number(e.rate || 0),
          Number(e.discount || 0),
          0,
          0,
          // ✅ LEDGER ID
          Number(e.gstLedgerId || 0),
          Number(e.amount || 0),
          Number(e.tdsRate || 0),
          e.godownId || null,
          e.purchaseLedgerId || purchaseLedgerId || null,
        ];
      });

      await db.query(insertItemSql, [itemValues]);
    }

    return res.json({
      success: true,
      message: "Voucher updated successfully",
      id: voucherId,
    });
  } catch (err) {
    console.error("🔥 Update failed:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// vouncher history post

router.post("/purchase-history", async (req, res) => {
  try {
    // 1️⃣ Normalize input (single OR array)
    const historyData = Array.isArray(req.body) ? req.body : [req.body];

    /* ================================
       2️⃣ CHECK EXISTING COLUMNS
    ================================= */
    const [colsRows] = await db.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'purchase_history'
    `);

    const existingCols = colsRows.map((r) => r.COLUMN_NAME);

    /* ================================
       3️⃣ REQUIRED COLUMNS (UPDATED)
    ================================= */
    const requiredCols = {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      itemName: "VARCHAR(255)",
      hsnCode: "VARCHAR(50)",
      batchNumber: "VARCHAR(255)",
      purchaseQuantity: "INT",
      rate: "DECIMAL(10,2)",
      purchaseDate: "DATE",
      voucherNumber: "VARCHAR(100)",
      companyId: "VARCHAR(100)",
      ownerType: "VARCHAR(50)",
      ownerId: "VARCHAR(100)",
      type: "VARCHAR(50) DEFAULT 'purchase'",
      godownId: "INT", // ✅ NEW FIELD (ONLY ID)
    };

    /* ================================
       4️⃣ CREATE TABLE (IF NOT EXISTS)
    ================================= */
    if (existingCols.length === 0) {
      await db.execute(`
        CREATE TABLE purchase_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          itemName VARCHAR(255),
          hsnCode VARCHAR(50),
          batchNumber VARCHAR(255),
          purchaseQuantity INT,
          rate DECIMAL(10,2),
          purchaseDate DATE,
          voucherNumber VARCHAR(100),
          companyId VARCHAR(100),
          ownerType VARCHAR(50),
          ownerId VARCHAR(100),
          type VARCHAR(50) DEFAULT 'purchase',
          godownId INT
        )
      `);
    } else {
      /* ================================
         5️⃣ ADD MISSING COLUMNS (AUTO)
      ================================= */
      for (const [col, def] of Object.entries(requiredCols)) {
        if (!existingCols.includes(col)) {
          await db.execute(`
            ALTER TABLE purchase_history
            ADD COLUMN ${col} ${def}
          `);
        }
      }
    }

    /* ================================
       6️⃣ INSERT DATA (UPDATED)
    ================================= */
    const insertSql = `
      INSERT INTO purchase_history
      (
        itemName,
        hsnCode,
        batchNumber,
        purchaseQuantity,
        rate,
        purchaseDate,
        voucherNumber,
        companyId,
        ownerType,
        ownerId,
        type,
        godownId
      )
      VALUES ?
    `;

    const values = historyData.map((e) => [
      e.itemName || null,
      e.hsnCode || null,
      e.batchNumber || null,
      Number(e.purchaseQuantity) || 0,
      Number(e.rate) || 0,
      e.purchaseDate || null,
      e.voucherNumber || null,
      e.companyId || null,
      e.ownerType || null,
      e.ownerId || null,
      e.type || "purchase",
      Number(e.godownId) || null, // ✅ ONLY ID SAVED
    ]);

    /* ================================
       7️⃣ BASIC SECURITY CHECK
    ================================= */
    if (values.some((v) => !v[7] || !v[8] || !v[9])) {
      return res.status(401).json({
        success: false,
        message: "Company / Owner missing",
      });
    }

    /* ================================
       8️⃣ EXECUTE QUERY
    ================================= */
    await db.query(insertSql, [values]);

    return res.json({
      success: true,
      message: "Purchase history saved successfully",
    });
  } catch (error) {
    console.error("Purchase history error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

//voucher history get

// router.get("/purchase-history", async (req, res) => {
//   try {
//     const [rows] = await db.execute("SELECT * FROM purchase_history");
//     return res.status(200).json({
//       success: true,
//       data: rows,
//     });
//   } catch (err) {
//     console.error("🔥 Fetch purchase history failed:", err);
//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// });

module.exports = router;
