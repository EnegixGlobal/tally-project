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

    pv.partyId AS partyId,
    l.name     AS partyName

  FROM purchase_history ph

  LEFT JOIN purchase_vouchers pv
    ON pv.number COLLATE utf8mb4_general_ci
     = ph.voucherNumber COLLATE utf8mb4_general_ci
    AND pv.company_id = ?
    AND pv.owner_type = ?
    AND pv.owner_id = ?

  LEFT JOIN ledgers l
    ON l.id = pv.partyId

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
    const { company_id, owner_type, owner_id, date } = req.query;

    if (!company_id || !owner_type || !owner_id || !date) {
      return res.status(400).json({ success: false, message: "Missing required params" });
    }

    const voucherNumber = await generateVoucherNumber({
      companyId: company_id,
      ownerType: owner_type,
      ownerId: owner_id,
      voucherType: 'purchase',
      date
    });

    return res.json({
      success: true,
      voucherNumber
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});


// Check duplicate voucher number
router.get("/check-duplicate/:number", async (req, res) => {
  try {
    const { number } = req.params;
    const { company_id } = req.query;

    if (!company_id || !number) {
      return res.status(400).json({ success: false, message: "Missing params" });
    }

    const [rows] = await db.execute(
      "SELECT id FROM purchase_vouchers WHERE number = ? AND company_id = ? LIMIT 1",
      [number, company_id]
    );

    return res.json({
      success: true,
      exists: rows.length > 0
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

// ✅ AUTO CREATE MODE COLUMN
let isModeChecked = false;
const ensureModeColumn = async () => {
  if (isModeChecked) return;
  const [rows] = await db.execute(`
    SHOW COLUMNS FROM purchase_vouchers LIKE 'mode'
  `);
  if (rows.length === 0) {
    await db.execute(`
      ALTER TABLE purchase_vouchers ADD COLUMN mode VARCHAR(50) DEFAULT 'item-invoice'
    `);
    console.log("✅ mode column created in purchase_vouchers");
  }
  isModeChecked = true;
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

// ================= AUTO CHECK DISCOUNT LEDGER COLUMN =================
async function ensureDiscountLedgerColumn() {
  const [rows] = await db.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'purchase_voucher_items'
      AND COLUMN_NAME = 'discountLedgerId'
    `
  );

  if (rows.length === 0) {
    console.log("⚠️ discountLedgerId missing → creating...");

    await db.query(`
      ALTER TABLE purchase_voucher_items
      ADD COLUMN discountLedgerId INT NULL
    `);

    console.log("✅ discountLedgerId column created");
  }
}



// ================= ROUTE =================

router.post("/", async (req, res) => {
  const {
    date,
    number,
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
    discountLedgerId,
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
    await ensureModeColumn();
    await ensureDiscountLedgerColumn();

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

    // ================= DUPLICATE CHECK =================
    if (number) {
      const [existingVoucher] = await db.execute(
        "SELECT id FROM purchase_vouchers WHERE number = ? AND company_id = ? LIMIT 1",
        [number, finalCompanyId]
      );

      if (existingVoucher.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Voucher number "${number}" already exists. Duplicate voucher numbers are not allowed.`,
        });
      }
    }

    // ================= GENERATE NUMBER =================
    let voucherNumber = number; // ✅ Use frontend number if exists

    if (!voucherNumber) {
      voucherNumber = await generateVoucherNumber({
        companyId: finalCompanyId,
        ownerType: finalOwnerType,
        ownerId: finalOwnerId,
        voucherType: "purchase",
        date,
      });
    }

    // ================= VALIDATION =================

    // Removed strict item-invoice check to support other modes
    if (!entries.length) {
      return res.status(400).json({
        success: false,
        message: "No entries found",
      });
    }

    // ================= INSERT VOUCHER =================

    const insertSql = `
      INSERT INTO purchase_vouchers (
        number, date, supplierInvoiceDate, narration, partyId, referenceNo, 
        dispatchDocNo, dispatchThrough, destination, purchaseLedgerId, 
        subtotal, cgstTotal, sgstTotal, igstTotal, discountTotal, tdsTotal, 
        total, company_id, owner_type, owner_id, mode
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const [voucherResult] = await db.execute(insertSql, [
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
      mode || "item-invoice",
    ]);

    const voucherId = voucherResult.insertId;

    // ================= INSERT ITEMS / ENTRIES =================

    if (mode === "item-invoice") {
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
            purchaseLedgerId,
            discountLedgerId
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
              Number(e.cgstLedgerId || 0),
              Number(e.sgstLedgerId || 0),
              0,
              Number(e.amount || 0),
              Number(e.tdsRate || 0),
              e.godownId || null,
              e.purchaseLedgerId || purchaseLedgerId || null,
              Number(discountLedgerId || 0),
            ];
          }

          return [
            voucherId,
            e.itemId,
            Number(e.quantity || 0),
            Number(e.rate || 0),
            Number(e.discount || 0),
            0,
            0,
            Number(e.gstLedgerId || 0),
            Number(e.amount || 0),
            Number(e.tdsRate || 0),
            e.godownId || null,
            e.purchaseLedgerId || purchaseLedgerId || null,
            Number(discountLedgerId || 0),
          ];
        });

        await db.query(insertItemSql, [itemValues]);
      }
    } else {
      // accounting-invoice
      const ledgerEntries = entries.filter(e => e.ledgerId);
      if (ledgerEntries.length > 0) {
        const insertEntrySql = `
          INSERT INTO voucher_entries (
            voucher_id,
            ledger_id,
            amount,
            entry_type,
            narration
          ) VALUES ?
        `;
        const entryValues = ledgerEntries.map(e => [
          voucherId,
          e.ledgerId,
          Number(e.amount || 0),
          e.type || "debit",
          e.narration || null
        ]);
        await db.query(insertEntrySql, [entryValues]);
      }
    }

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

    // 🏆 DYNAMIC TOTALS FIX FOR ACCOUNTING MODE (FOR REGISTER DISPLAY)
    if (rows.length > 0) {
      const accVoucherIds = rows
        .filter((v) => v.mode === "accounting-invoice")
        .map((v) => v.id);

      if (accVoucherIds.length > 0) {
        // Fetch ALL entries for these accounting vouchers in ONE go
        const [entries] = await db.query(
          `SELECT ve.voucher_id, ve.amount, ve.entry_type, l.name as ledger_name, g.name as group_name
           FROM voucher_entries ve
           LEFT JOIN ledgers l ON l.id = ve.ledger_id
           LEFT JOIN ledger_groups g ON g.id = l.group_id
           WHERE ve.voucher_id IN (?)`,
          [accVoucherIds]
        );

        const entriesByVoucher = entries.reduce((acc, e) => {
          if (!acc[e.voucher_id]) acc[e.voucher_id] = [];
          acc[e.voucher_id].push(e);
          return acc;
        }, {});

        rows.forEach((v) => {
          if (v.mode === "accounting-invoice") {
            const vEntries = entriesByVoucher[v.id] || [];
            let subtotal = 0;
            let cgst = 0;
            let sgst = 0;
            let igst = 0;
            let discount = 0;

            vEntries.forEach((e) => {
              const amt = Number(e.amount || 0);
              const lName = (e.ledger_name || "").toLowerCase();
              const gName = (e.group_name || "").toLowerCase();

              if (e.entry_type === "debit") {
                const isTax = (gName && (gName.includes("duties") || gName.includes("tax") || gName.includes("gst"))) || 
                             (lName.includes("gst") || lName.includes("tax") || lName.includes("igst") || lName.includes("cgst") || lName.includes("sgst") || lName.includes("@"));

                if (isTax) {
                  if (lName.includes("cgst")) cgst += amt;
                  else if (lName.includes("sgst") || lName.includes("utgst")) sgst += amt;
                  else if (lName.includes("igst")) igst += amt;
                  else cgst += amt;
                } else {
                  subtotal += amt;
                }
              } else {
                // Check for discount in credits for Purchase
                const isDiscount = lName.includes("discount") || (gName && gName.includes("discount"));
                if (isDiscount) {
                  discount += amt;
                }
              }
            });

            v.subtotal = subtotal;
            v.cgstTotal = cgst;
            v.sgstTotal = sgst;
            v.igstTotal = igst;
            v.discountTotal = discount;
          }
        });
      }
    }

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
        company_id,
        mode
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

    // 🏆 DYNAMIC TOTALS FIX FOR ACCOUNTING MODE (FOR REGISTER DISPLAY)
    if (rows.length > 0) {
      const accVoucherIds = rows
        .filter((v) => v.mode === "accounting-invoice")
        .map((v) => v.id);

      if (accVoucherIds.length > 0) {
        const [entries] = await db.query(
          `SELECT ve.voucher_id, ve.amount, ve.entry_type, l.name as ledger_name, g.name as group_name
           FROM voucher_entries ve
           LEFT JOIN ledgers l ON l.id = ve.ledger_id
           LEFT JOIN ledger_groups g ON g.id = l.group_id
           WHERE ve.voucher_id IN (?)`,
          [accVoucherIds]
        );

        const entriesByVoucher = entries.reduce((acc, e) => {
          if (!acc[e.voucher_id]) acc[e.voucher_id] = [];
          acc[e.voucher_id].push(e);
          return acc;
        }, {});

        rows.forEach((v) => {
          if (v.mode === "accounting-invoice") {
            const vEntries = entriesByVoucher[v.id] || [];
            let subtotal = 0;
            let cgst = 0;
            let sgst = 0;
            let igst = 0;
            let discount = 0;

            vEntries.forEach((e) => {
              const amt = Number(e.amount || 0);
              const lName = (e.ledger_name || "").toLowerCase();
              const gName = (e.group_name || "").toLowerCase();

              if (e.entry_type === "debit") {
                const isTax = (gName && (gName.includes("duties") || gName.includes("tax") || gName.includes("gst"))) || 
                             (lName.includes("gst") || lName.includes("tax") || lName.includes("igst") || lName.includes("cgst") || lName.includes("sgst") || lName.includes("@"));

                if (isTax) {
                  if (lName.includes("cgst")) cgst += amt;
                  else if (lName.includes("sgst") || lName.includes("utgst")) sgst += amt;
                  else if (lName.includes("igst")) igst += amt;
                  else cgst += amt;
                } else {
                  subtotal += amt;
                }
              } else {
                // Check for discount in credits for Purchase
                const isDiscount = lName.includes("discount") || (gName && gName.includes("discount"));
                if (isDiscount) {
                  discount += amt;
                }
              }
            });

            v.subtotal = subtotal;
            v.cgstTotal = cgst;
            v.sgstTotal = sgst;
            v.igstTotal = igst;
            v.discountTotal = discount;
          }
        });
      }
    }

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
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Get voucher details before deletion
    const [rows] = await conn.execute(
      "SELECT number, company_id, owner_type, owner_id FROM purchase_vouchers WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "Voucher not found",
      });
    }

    const { number: deletedNumber, company_id, owner_type, owner_id } = rows[0];

    // Extract prefix, FY, and sequence: PRV/25-26/000002 -> ["PRV", "25-26", "000002"]
    const parts = deletedNumber.split("/");
    if (parts.length < 3) {
      // If number format is unexpected, just do a normal delete
      await conn.execute("DELETE FROM voucher_entries WHERE voucher_id = ?", [id]);
      await conn.execute("DELETE FROM purchase_voucher_items WHERE voucherId = ?", [id]);
      await conn.execute("DELETE FROM purchase_history WHERE voucherNumber = ?", [deletedNumber]);
      await conn.execute("DELETE FROM purchase_vouchers WHERE id = ?", [id]);
      await conn.commit();
      return res.json({ success: true, message: "Voucher deleted (no renumbering due to format)" });
    }

    const prefix = parts[0];
    const fy = parts[1];
    const deletedSeq = parseInt(parts[2]);

    // 2️⃣ Delete voucher and related entries
    await conn.execute("DELETE FROM voucher_entries WHERE voucher_id = ?", [id]);
    await conn.execute("DELETE FROM purchase_voucher_items WHERE voucherId = ?", [id]);
    await conn.execute("DELETE FROM purchase_history WHERE voucherNumber = ?", [deletedNumber]);
    await conn.execute("DELETE FROM purchase_vouchers WHERE id = ?", [id]);

    // 3️⃣ Find subsequent vouchers to renumber
    // We look for numbers like "PRV/25-26/%"
    const [subsequentVouchers] = await conn.execute(
      `SELECT id, number FROM purchase_vouchers 
       WHERE company_id = ? AND owner_type = ? AND owner_id = ? 
       AND number LIKE ? 
       ORDER BY id ASC`,
      [company_id, owner_type, owner_id, `${prefix}/${fy}/%`]
    );

    for (const voucher of subsequentVouchers) {
      const vParts = voucher.number.split("/");
      if (vParts.length === 3) {
        const vSeq = parseInt(vParts[2]);
        if (vSeq > deletedSeq) {
          const newSeq = vSeq - 1;
          const newNumber = `${prefix}/${fy}/${String(newSeq).padStart(6, "0")}`;

          // Update main table
          await conn.execute(
            "UPDATE purchase_vouchers SET number = ? WHERE id = ?",
            [newNumber, voucher.id]
          );

          // Update history table
          await conn.execute(
            "UPDATE purchase_history SET voucherNumber = ? WHERE voucherNumber = ? AND companyId = ?",
            [newNumber, voucher.number, company_id]
          );
        }
      }
    }

    await conn.commit();
    return res.json({
      success: true,
      message: "Purchase voucher deleted and subsequent vouchers renumbered successfully",
    });
  } catch (err) {
    await conn.rollback();
    console.error("Delete error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete and renumber vouchers",
    });
  } finally {
    conn.release();
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
       2️⃣ GET ITEMS / ENTRIES
    ====================== */

    let entries = [];
    if (voucher.mode === "item-invoice" || !voucher.mode) {
      const [items] = await db.execute(
        `
        SELECT *
        FROM purchase_voucher_items
        WHERE voucherId = ?
        `,
        [voucherId]
      );

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

      entries = items.map((item) => {

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
          discountLedgerId: item.discountLedgerId,

          // 🔥 FROM HISTORY
          batchNumber: historyRow?.batchNumber || "",
          hsnCode: historyRow?.hsnCode || "",
          purchaseDate: historyRow?.purchaseDate || voucher.date,
        };
      });
    } else {
      // accounting-invoice
      const [ledgerRows] = await db.execute(
        `SELECT id, ledger_id as ledgerId, amount, entry_type as type, narration 
         FROM voucher_entries 
         WHERE voucher_id = ?`,
        [voucherId]
      );
      entries = ledgerRows;
    }

    // 🔍 Fallback: If tdsLedgerId is missing in main row, try to get it from first item
    // ⚠️ tdsRate column might be DECIMAL(10,2), so we must parse it to INT to match matches frontend ID
    let fallbackTdsId = 0;
    let fallbackDiscountId = 0;
    if (voucher.mode === "item-invoice") {
      const itemWithTds = entries.find(i => Number(i.tdsRate) > 0);
      if (itemWithTds) fallbackTdsId = Math.round(Number(itemWithTds.tdsRate));

      const itemWithDiscount = entries.find(i => Number(i.discountLedgerId) > 0);
      if (itemWithDiscount) fallbackDiscountId = Math.round(Number(itemWithDiscount.discountLedgerId));
    }

    const tdsLedgerId = voucher.tdsLedgerId || (fallbackTdsId > 0 ? fallbackTdsId : null);
    const discountLedgerId = voucher.discountLedgerId || (fallbackDiscountId > 0 ? fallbackDiscountId : null);

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
      discountLedgerId,
      tdsTotal: voucher.tdsTotal, // ✅ Added
      tdsLedgerId: tdsLedgerId, // ✅ Use the calculated variable with fallback
      total: voucher.total,
      mode: voucher.mode, // ✅ Added mode

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
    discountLedgerId,
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
      "SELECT number, company_id, owner_type, owner_id FROM purchase_vouchers WHERE id = ?",
      [voucherId]
    );

    if (voucherRows.length === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const existing = voucherRows[0];

    // ================= DUPLICATE CHECK =================
    if (number && number !== existing.number) {
      const [duplicateRows] = await db.execute(
        "SELECT id FROM purchase_vouchers WHERE number = ? AND company_id = ? AND id != ? LIMIT 1",
        [number, finalCompanyId, voucherId]
      );

      if (duplicateRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Voucher number "${number}" already exists in another voucher. Duplicate voucher numbers are not allowed.`,
        });
      }
    }

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
    await ensureModeColumn();
    await ensureDiscountLedgerColumn();

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
        owner_id = ?,
        mode = ?
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
      mode || "item-invoice",
      voucherId,
    ]);

    // ================= UPDATE ITEMS / ENTRIES (DELETE OLD + INSERT NEW) =================

    // 1️⃣ Delete old entries (from items, voucher_entries, and purchase_history)
    await db.execute("DELETE FROM purchase_voucher_items WHERE voucherId = ?", [
      voucherId,
    ]);
    await db.execute("DELETE FROM voucher_entries WHERE voucher_id = ?", [
      voucherId,
    ]);
    if (existing && existing.number) {
      await db.execute("DELETE FROM purchase_history WHERE voucherNumber = ? AND companyId = ?", [
        existing.number,
        finalCompanyId,
      ]);
    }

    // 2️⃣ Insert new entries based on mode
    if (mode === "item-invoice") {
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
            purchaseLedgerId,
            discountLedgerId
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
              Number(e.cgstLedgerId || 0),
              Number(e.sgstLedgerId || 0),
              0,
              Number(e.amount || 0),
              Number(e.tdsRate || 0),
              e.godownId || null,
              e.purchaseLedgerId || purchaseLedgerId || null,
              Number(discountLedgerId || 0),
            ];
          }

          return [
            voucherId,
            e.itemId,
            Number(e.quantity || 0),
            Number(e.rate || 0),
            Number(e.discount || 0),
            0,
            0,
            Number(e.gstLedgerId || 0),
            Number(e.amount || 0),
            Number(e.tdsRate || 0),
            e.godownId || null,
            e.purchaseLedgerId || purchaseLedgerId || null,
            Number(discountLedgerId || 0),
          ];
        });

        await db.query(insertItemSql, [itemValues]);
      }
    } else {
      // accounting-invoice
      const ledgerEntries = entries.filter((e) => e.ledgerId);
      if (ledgerEntries.length > 0) {
        const insertEntrySql = `
          INSERT INTO voucher_entries (
            voucher_id,
            ledger_id,
            amount,
            entry_type,
            narration
          ) VALUES ?
        `;
        const entryValues = ledgerEntries.map((e) => [
          voucherId,
          e.ledgerId,
          Number(e.amount || 0),
          e.type || "debit",
          e.narration || null,
        ]);
        await db.query(insertEntrySql, [entryValues]);
      }
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
