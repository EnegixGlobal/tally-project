const express = require("express");
const router = express.Router();
const pool = require("../db");

const systemGroups = {
  "-3": "Branch/Division",
  "-4": "Capital Account",
  "-5": "Current Assets",
  "-6": "Current Liabilities",
  "-7": "Direct Expenses",
  "-8": "Direct Income",
  "-9": "Fixed Assets",
  "-10": "Indirect Expenses",
  "-11": "Indirect Income",
  "-12": "Investments",
  "-13": "Loan(Liability)",
  "-14": "Misc. Expense (Assets)",
  "-15": "Purchase Accounts",
  "-16": "Sales Accounts",
  "-17": "Suspense A/C",
  "-18": "Profit & Loss A/c",
  "-19": "TDS Payables",
  "-100": "Debit/Credit Note from Creditors",
  "-101": "Debit/Credit Note to Debtors",
  "-102": "Deposite(Assest)",
  "-103": "Duties & Taxes",
  "-104": "Loans and Advances (Assets)",
  "-105": "Provisions",
  "-106": "Reserves & Surplus",
  "-107": "Secured Loan",
  "-108": "Stock-In-Hand",
  "-109": "Sundry Creditors",
  "-110": "Sundry Debtors",
  "-111": "Unsecured Loans",
  "-112": "Cash-in-Hand",
  "-113": "Bank Accounts",
  "-114": "Bank OD A/c"
};

function getGroupName(groupId, dbGroupName) {
  if (groupId && groupId < 0) {
    return systemGroups[String(groupId)] || dbGroupName;
  }
  return dbGroupName;
}

router.get("/", async (req, res) => {
  try {
    const finalCompanyId = req.query.company_id || req.body?.companyId;
    const finalOwnerType = req.query.owner_type || req.body?.ownerType;
    const finalOwnerId = req.query.owner_id || req.body?.ownerId;
    const fromDate = req.query.from_date;
    const toDate = req.query.to_date;

    if (!finalCompanyId || !finalOwnerType || !finalOwnerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let query = `SELECT 
          sv.id,
          sv.number AS voucherNo,
          sv.date,
          sv.total AS netAmount,
          sv.total,
          sv.subtotal AS taxableAmount,
          sv.cgstTotal AS cgstAmount,
          sv.sgstTotal AS sgstAmount,
          sv.igstTotal AS igstAmount,
          sv.mode,
          
          l.id AS ledgerId,
          l.name AS partyName,
          l.group_id AS groupId,
          lg.name AS groupName,
          l.gst_number AS partyGSTIN,
          sv.overallDiscountAmount AS overallDiscount,
          ld.name AS overallDiscountLedgerName
        FROM sales_vouchers sv
        LEFT JOIN ledgers l 
          ON sv.partyId = l.id
        LEFT JOIN ledger_groups lg 
          ON l.group_id = lg.id
        LEFT JOIN ledgers ld
          ON sv.overallDiscountLedgerId = ld.id

        WHERE sv.company_id = ?
          AND sv.owner_type = ?
          AND sv.owner_id = ?`;

    const queryParams = [finalCompanyId, finalOwnerType, finalOwnerId];

    if (fromDate && toDate) {
      query += ` AND sv.date BETWEEN ? AND ?`;
      queryParams.push(fromDate, toDate);
    }

    query += ` ORDER BY sv.date DESC`;

    const [rows] = await pool.execute(query, queryParams);

    if (rows.length > 0) {
      const voucherIds = rows.map(row => row.id);

      // =========================================================
      // 🔹 FETCH ITEMS FOR THESE VOUCHERS
      // =========================================================
      const [items] = await pool.query(
        `SELECT 
            svi.id, svi.voucherId, svi.itemId, 
            svi.quantity, svi.rate, svi.amount,
            svi.cgstRate, svi.sgstRate, svi.igstRate, 
            svi.discount, 
            svi.salesLedgerId,
            svi.discountLedgerId,
            u.symbol AS unit,
            
            sl.name AS salesLedgerName, 
            sl.group_id AS salesLedgerGroupId,
            lg.name AS salesLedgerGroupName,

            l_cgst.name AS cgstLedgerName,
            l_sgst.name AS sgstLedgerName,
            l_igst.name AS igstLedgerName,
            
            l_disc.name AS discountLedgerName

         FROM sales_voucher_items svi
         
         LEFT JOIN stock_items i ON svi.itemId = i.id
         LEFT JOIN stock_units u ON i.unit = u.id
         LEFT JOIN ledgers sl ON svi.salesLedgerId = sl.id
         LEFT JOIN ledger_groups lg ON sl.group_id = lg.id

          LEFT JOIN ledgers l_cgst ON (svi.cgstRate = l_cgst.id AND (l_cgst.group_id = -103 OR l_cgst.group_id IN (SELECT id FROM ledger_groups WHERE parent = -103 OR name LIKE '%Duties%' OR name LIKE '%Tax%')))
          LEFT JOIN ledgers l_sgst ON (svi.sgstRate = l_sgst.id AND (l_sgst.group_id = -103 OR l_sgst.group_id IN (SELECT id FROM ledger_groups WHERE parent = -103 OR name LIKE '%Duties%' OR name LIKE '%Tax%')))
          LEFT JOIN ledgers l_igst ON (svi.igstRate = l_igst.id AND (l_igst.group_id = -103 OR l_igst.group_id IN (SELECT id FROM ledger_groups WHERE parent = -103 OR name LIKE '%Duties%' OR name LIKE '%Tax%')))
         
         LEFT JOIN ledgers l_disc ON svi.discountLedgerId = l_disc.id

         WHERE svi.voucherId IN (?)`,
        [voucherIds]
      );

      // =========================================================
      // 🔹 FETCH GST LEDGER NAMES BY NAME PATTERN (Server-safe fallback)
      // The JOIN svi.cgstRate/sgstRate/igstRate = ledger.id may fail on some servers
      // if those columns store percentage rates instead of ledger IDs.
      // We pre-fetch the actual GST ledger names from the DB as a reliable fallback.
      // =========================================================
      const [gstLedgerRows] = await pool.query(
        `SELECT id, name, group_id FROM ledgers
         WHERE LOWER(name) LIKE '%igst%'
            OR LOWER(name) LIKE '%cgst%'
            OR LOWER(name) LIKE '%utgst%'
            OR (LOWER(name) LIKE '%sgst%' AND LOWER(name) NOT LIKE '%igst%')`
      );

      // Pick the first matching ledger for each GST type
      const fallbackCgstLedger = gstLedgerRows.find(l => {
        const n = l.name.toLowerCase();
        return n.includes('cgst') && !n.includes('igst');
      });
      const fallbackSgstLedger = gstLedgerRows.find(l => {
        const n = l.name.toLowerCase();
        return (n.includes('sgst') || n.includes('utgst')) && !n.includes('igst');
      });
      const fallbackIgstLedger = gstLedgerRows.find(l => l.name.toLowerCase().includes('igst'));

      // =========================================================
      // 🔹 FETCH VOUCHER ENTRIES (For Accounting Summary Vouchers)
      // =========================================================
      const accVoucherIds = rows
        .filter(row => row.mode === "accounting-invoice")
        .map(row => row.id);

      let voucherEntries = [];
      if (accVoucherIds.length > 0) {
        const [entriesResult] = await pool.query(
          `SELECT 
              ve.id, ve.voucher_id AS voucherId, ve.ledger_id AS ledgerId,
              ve.amount, ve.entry_type AS type, ve.narration,
              l.name AS ledgerName, l.group_id AS groupId,
              lg.name AS groupName
           FROM voucher_entries ve
           LEFT JOIN ledgers l ON ve.ledger_id = l.id
           LEFT JOIN ledger_groups lg ON l.group_id = lg.id
           WHERE ve.voucher_id IN (?)`,
          [accVoucherIds]
        );
        voucherEntries = entriesResult;
      }

      // Attach items to their respective vouchers with numeric conversion
      const itemsMap = {};

      // Process items from sales_voucher_items (Item-wise)
      items.forEach(item => {
        if (!itemsMap[item.voucherId]) itemsMap[item.voucherId] = [];

        const cgstRateNum = Number(item.cgstRate) || 0;
        const sgstRateNum = Number(item.sgstRate) || 0;
        const igstRateNum = Number(item.igstRate) || 0;

        // Use JOIN result if available, else fall back to name-based ledger lookup
        const resolvedCgstName = item.cgstLedgerName ||
          (cgstRateNum > 0 && fallbackCgstLedger ? fallbackCgstLedger.name : null);
        const resolvedSgstName = item.sgstLedgerName ||
          (sgstRateNum > 0 && fallbackSgstLedger ? fallbackSgstLedger.name : null);
        const resolvedIgstName = item.igstLedgerName ||
          (igstRateNum > 0 && fallbackIgstLedger ? fallbackIgstLedger.name : null);

        itemsMap[item.voucherId].push({
          ...item,
          salesLedgerGroupName: getGroupName(item.salesLedgerGroupId, item.salesLedgerGroupName),
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
          discount: Number(item.discount) || 0,
          cgstRate: cgstRateNum,
          sgstRate: sgstRateNum,
          igstRate: igstRateNum,
          cgstLedgerName: resolvedCgstName,
          sgstLedgerName: resolvedSgstName,
          igstLedgerName: resolvedIgstName,
        });
      });

      // Process entries from voucher_entries (Accounting-wise)
      voucherEntries.forEach(entry => {
        if (!itemsMap[entry.voucherId]) itemsMap[entry.voucherId] = [];
        
        // Find the voucher for this entry
        const voucher = rows.find(r => r.id === entry.voucherId);
        
        // Skip the party entry (as it is already the main partyName in rows)
        // Usually, the party is a debit entry in a sales voucher
        if (voucher && (
          String(voucher.ledgerId) === String(entry.ledgerId) ||
          String(voucher.partyName).toLowerCase() === String(entry.ledgerName).toLowerCase()
        )) return;

        const resolvedGroupName = getGroupName(entry.groupId, entry.groupName);
        const lName = (entry.ledgerName || "").toLowerCase();
        const gName = (resolvedGroupName || "").toLowerCase();

        // Detect GST ledger type by ledger name pattern (fallback for servers where group_id != -103)
        const isIgstLedger = lName.includes("igst");
        const isCgstLedger = lName.includes("cgst") && !isIgstLedger;
        const isSgstLedger = (lName.includes("sgst") || lName.includes("utgst")) && !isIgstLedger;
        const isGstByName = isIgstLedger || isCgstLedger || isSgstLedger;

        const isTax = gName.includes("duties") || gName.includes("tax") || entry.groupId === -103 || isGstByName;
        const isSales = !isGstByName && (gName.includes("sales account") || entry.groupId === -16);
        const isDiscount = !isGstByName && (lName.includes("discount") || gName.includes("discount") || entry.groupId === -10 || entry.groupId === -11);

        itemsMap[entry.voucherId].push({
          id: entry.id,
          voucherId: entry.voucherId,
          amount: Number(entry.amount) || 0,
          salesLedgerName: entry.ledgerName,
          // Force Duties & Taxes group for recognized tax ledgers so frontend classifies correctly
          salesLedgerGroupName: isTax ? "Duties & Taxes" : resolvedGroupName,
          salesLedgerGroupId: isTax ? -103 : entry.groupId,
          // Map GST ledger names using precise name-based flags (works even if group_id != -103 on server)
          cgstLedgerName: (isTax && isCgstLedger) ? entry.ledgerName : null,
          sgstLedgerName: (isTax && isSgstLedger) ? entry.ledgerName : null,
          igstLedgerName: (isTax && isIgstLedger) ? entry.ledgerName : null,
          discountLedgerName: isDiscount ? entry.ledgerName : null,
          type: entry.type
        });
      });

      rows.forEach(row => {
        row.items = itemsMap[row.id] || [];
        row.groupName = getGroupName(row.groupId, row.groupName);

        // Ensure voucher level totals are numbers
        row.netAmount = Number(row.netAmount) || 0;
        row.total = Number(row.total) || 0;
        row.taxableAmount = Number(row.taxableAmount) || 0;
        row.cgstAmount = Number(row.cgstAmount) || 0;
        row.sgstAmount = Number(row.sgstAmount) || 0;
        row.igstAmount = Number(row.igstAmount) || 0;
        row.overallDiscount = Number(row.overallDiscount) || 0;
      });
    }

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.error("Sales Report Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

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
        sv.id,
        sv.number,
        sv.date,
        sv.partyId,
        sv.referenceNo,
        sv.supplierInvoiceDate,
        sv.subtotal,
        sv.cgstTotal,
        sv.sgstTotal,
        sv.igstTotal,
        sv.discountTotal,
        sv.total,
        sv.salesLedgerId,
        sv.company_id,
        sl.name AS salesLedgerName
      FROM sales_vouchers sv
      LEFT JOIN ledgers sl ON sv.salesLedgerId = sl.id
      WHERE sv.owner_type = ?
        AND sv.owner_id = ?
    `;

    const params = [owner_type, owner_id];

    // Date range filter (takes priority over month/year)
    if (fromDate && toDate) {
      // Use DATE() function to ensure proper date comparison and include entire toDate
      sql += " AND DATE(sv.date) >= DATE(?) AND DATE(sv.date) <= DATE(?)";
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

      sql += " AND MONTH(sv.date) = ? AND YEAR(sv.date) = ?";
      params.push(monthNumber, year);
    }

    // optional company filter
    if (company_id) {
      sql += " AND sv.company_id = ?";
      params.push(company_id);
    }

    sql += " ORDER BY sv.date DESC";

    const [rows] = await pool.execute(sql, params);

    // ── Enrich each row with GST ledger names from items ──────────────────
    if (rows.length > 0) {
      const voucherIds = rows.map(r => r.id);

      // Fetch distinct GST ledger names per voucher from sales_voucher_items
      const [itemRows] = await pool.query(
        `SELECT DISTINCT
            svi.voucherId,
            l_cgst.name  AS cgstLedgerName,
            l_sgst.name  AS sgstLedgerName,
            l_igst.name  AS igstLedgerName,
            l_disc.name  AS discountLedgerName
         FROM sales_voucher_items svi
         LEFT JOIN ledgers l_cgst ON svi.cgstRate  = l_cgst.id
         LEFT JOIN ledgers l_sgst ON svi.sgstRate  = l_sgst.id
         LEFT JOIN ledgers l_igst ON svi.igstRate  = l_igst.id
         LEFT JOIN ledgers l_disc ON svi.discountLedgerId = l_disc.id
         WHERE svi.voucherId IN (?)`,
        [voucherIds]
      );

      // Build a map for fast lookup
      const itemMap = {};
      itemRows.forEach(item => {
        if (!itemMap[item.voucherId]) {
          itemMap[item.voucherId] = {
            cgstLedgerName:     item.cgstLedgerName     || null,
            sgstLedgerName:     item.sgstLedgerName     || null,
            igstLedgerName:     item.igstLedgerName     || null,
            discountLedgerName: item.discountLedgerName || null,
          };
        } else {
          // Keep first non-null value found
          const m = itemMap[item.voucherId];
          if (!m.cgstLedgerName)     m.cgstLedgerName     = item.cgstLedgerName;
          if (!m.sgstLedgerName)     m.sgstLedgerName     = item.sgstLedgerName;
          if (!m.igstLedgerName)     m.igstLedgerName     = item.igstLedgerName;
          if (!m.discountLedgerName) m.discountLedgerName = item.discountLedgerName;
        }
      });

      // Merge into rows
      rows.forEach(row => {
        const info = itemMap[row.id] || {};
        row.cgstLedgerName     = info.cgstLedgerName     || null;
        row.sgstLedgerName     = info.sgstLedgerName     || null;
        row.igstLedgerName     = info.igstLedgerName     || null;
        row.discountLedgerName = info.discountLedgerName || null;
      });
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
    console.error("Month-wise sales error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load month-wise sales",
    });
  }
});


module.exports = router;
