const express = require("express");
const router = express.Router();
const db = require("../db");
const {generateVoucherNumber} = require('../utils/generateVoucherNumber')
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

    // Ensure table and `type` column exist before selecting
    const existingColsQuery = `
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_history'
    `;
    const [colsRows] = await db.execute(existingColsQuery);
    const existingCols = colsRows.map((r) => r.COLUMN_NAME);

    if (existingCols.length === 0) {
      const createTableSql = `
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
          type VARCHAR(50) DEFAULT 'purchase'
        )
      `;
      await db.execute(createTableSql);
    } else if (!existingCols.includes("type")) {
      await db.execute(
        "ALTER TABLE purchase_history ADD COLUMN type VARCHAR(50) DEFAULT 'purchase'"
      );
    }

    const selectSql = `
      SELECT 
        id,
        itemName,
        hsnCode,
        batchNumber,
        purchaseQuantity,
        rate,
        purchaseDate,
        voucherNumber,
        godownId,
        companyId,
        ownerType,
        ownerId,
        type
      FROM purchase_history
      WHERE companyId = ? AND ownerType = ? AND ownerId = ?
      ORDER BY purchaseDate DESC, id DESC
    `;

    const [rows] = await db.execute(selectSql, [
      company_id,
      owner_type,
      owner_id,
    ]);

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("🔥 Fetch purchase history failed:", error);
    return res.status(500).json({ success: false, error: error.message });
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
router.post("/", async (req, res) => {
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
    total,
    entries,
    mode,
    purchaseLedgerId,
    companyId,
    ownerType,
    ownerId, // ⭐ Frontend se receive
  } = req.body;

  // ⭐ Accept from query also
  const qCompanyId = req.query.company_id;
  const qOwnerType = req.query.owner_type;
  const qOwnerId = req.query.owner_id;

  const finalCompanyId = companyId || qCompanyId;
  const finalOwnerType = ownerType || qOwnerType;
  const finalOwnerId = ownerId || qOwnerId;

  // 🔐 Security Check
  if (!finalCompanyId || !finalOwnerType || !finalOwnerId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing company or owner info",
    });
  }

  const dispatchDocNo = dispatchDetails?.docNo || null;
  const dispatchThrough = dispatchDetails?.through || null;
  const destination = dispatchDetails?.destination || null;

  let insertVoucherSql = "";
  let insertVoucherValues = [];
  let voucherId;

  const voucherNumber = await generateVoucherNumber({
  companyId: finalCompanyId,
  ownerType: finalOwnerType,
  ownerId: finalOwnerId,
  voucherType: "PRV",
  date
});


  try {
    if (mode === "item-invoice") {
      insertVoucherSql = `
        INSERT INTO purchase_vouchers (
          number, date, supplierInvoiceDate, narration, partyId, referenceNo,
          dispatchDocNo, dispatchThrough, destination, purchaseLedgerId,
          subtotal, cgstTotal, sgstTotal, igstTotal, discountTotal, total,
          company_id, owner_type, owner_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      insertVoucherValues = [
       voucherNumber,
        date ?? null,
        supplierInvoiceDate ?? null,
        narration ?? null,
        partyId ?? null,
        referenceNo ?? null,
        dispatchDocNo,
        dispatchThrough,
        destination,
        purchaseLedgerId ?? null,
        subtotal ?? 0,
        cgstTotal ?? 0,
        sgstTotal ?? 0,
        igstTotal ?? 0,
        discountTotal ?? 0,
        total ?? 0,
        finalCompanyId,
        finalOwnerType,
        finalOwnerId,
      ];
    } else {
      // ⚠ If needed, update this for account invoice mode later
      insertVoucherSql = `
        INSERT INTO voucher_main (voucher_number, date, narration)
        VALUES (?, ?, ?)
      `;
      insertVoucherValues = [number ?? null, date ?? null, narration ?? null];
    }

    const [voucherResult] = await db.execute(
      insertVoucherSql,
      insertVoucherValues
    );
    voucherId = voucherResult.insertId;

    const itemEntries = entries.filter((e) => e.itemId);
    const ledgerEntries = entries.filter((e) => e.ledgerId);

    // ⭐ Insert Items
    if (itemEntries.length > 0) {
      const insertItemQuery = `
        INSERT INTO purchase_voucher_items (
          voucherId, itemId, quantity, rate, discount,
          cgstRate, sgstRate, igstRate, amount, godownId
        ) VALUES ?
      `;
      const itemValues = itemEntries.map((e) => [
        voucherId,
        e.itemId ?? null,
        e.quantity ?? 0,
        e.rate ?? 0,
        e.discount ?? 0,
        e.cgstRate ?? 0,
        e.sgstRate ?? 0,
        e.igstRate ?? 0,
        e.amount ?? 0,
        e.godownId ?? null,
      ]);

      await db.query(insertItemQuery, [itemValues]);
    }

    // ⭐ Insert Ledger Entries
    if (ledgerEntries.length > 0) {
      const insertLedgerQuery = `
        INSERT INTO voucher_entries (
          voucher_id, ledger_id, amount, entry_type
        ) VALUES ?
      `;
      const ledgerValues = ledgerEntries.map((e) => [
        voucherId,
        e.ledgerId,
        e.amount,
        e.type,
      ]);

      await db.query(insertLedgerQuery, [ledgerValues]);
    }

    return res.status(200).json({
      success: true,
       voucherNumber,
      message: "Purchase voucher saved successfully",
      id: voucherId,
    });
  } catch (err) {
    console.error("🔥 Purchase voucher save failed:", err);
    return res.status(500).json({ success: false, error: err.message });
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
    total,
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

  // console.log("🔐 Update Auth →", {
  //   companyId: finalCompanyId,
  //   ownerType: finalOwnerType,
  //   ownerId: finalOwnerId,
  // });

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
      // console.log(
      //   "⚡ Auto fixed missing company fields for voucher:",
      //   voucherId
      // );
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
        total = ?,
        company_id = ?,     -- ⭐ Updated
        owner_type = ?,     -- ⭐ Updated
        owner_id = ?        -- ⭐ Updated
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
      finalCompanyId,
      finalOwnerType,
      finalOwnerId,
      voucherId,
    ]);

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
