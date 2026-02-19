const express = require("express");
const router = express.Router();
const pool = require("../db");

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
          
          l.id AS ledgerId,
          l.name AS partyName,
          l.group_id AS groupId,
          lg.name AS groupName,
          l.gst_number AS partyGSTIN

        FROM sales_vouchers sv
        LEFT JOIN ledgers l 
          ON sv.partyId = l.id
        LEFT JOIN ledger_groups lg 
          ON l.group_id = lg.id

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

    // =========================================================
    // 🔹 FETCH ITEMS FOR THESE VOUCHERS
    // =========================================================
    if (rows.length > 0) {
      const voucherIds = rows.map(row => row.id);

      // Use .query for array expansion support
      const [items] = await pool.query(
        `SELECT 
            svi.id, svi.voucherId, svi.itemId, 
            svi.quantity, svi.rate, svi.amount,
            svi.cgstRate, svi.sgstRate, svi.igstRate, 
            svi.discount, 
            svi.salesLedgerId,
            
            sl.name AS salesLedgerName, 
            sl.group_id AS salesLedgerGroupId,
            lg.name AS salesLedgerGroupName,

            l_cgst.name AS cgstLedgerName,
            l_sgst.name AS sgstLedgerName,
            l_igst.name AS igstLedgerName

         FROM sales_voucher_items svi
         
         LEFT JOIN ledgers sl ON svi.salesLedgerId = sl.id
         LEFT JOIN ledger_groups lg ON sl.group_id = lg.id

         LEFT JOIN ledgers l_cgst ON svi.cgstRate = l_cgst.id
         LEFT JOIN ledgers l_sgst ON svi.sgstRate = l_sgst.id
         LEFT JOIN ledgers l_igst ON svi.igstRate = l_igst.id

         WHERE svi.voucherId IN (?)`,
        [voucherIds]
      );

      // Attach items to their respective vouchers with numeric conversion
      const itemsMap = {};
      items.forEach(item => {
        if (!itemsMap[item.voucherId]) {
          itemsMap[item.voucherId] = [];
        }

        // Convert rates/amounts to numbers
        itemsMap[item.voucherId].push({
          ...item,
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
          discount: Number(item.discount) || 0,
          cgstRate: Number(item.cgstRate) || 0,
          sgstRate: Number(item.sgstRate) || 0,
          igstRate: Number(item.igstRate) || 0,
        });
      });

      rows.forEach(row => {
        row.items = itemsMap[row.id] || [];

        // Ensure voucher level totals are numbers
        row.netAmount = Number(row.netAmount) || 0;
        row.total = Number(row.total) || 0;
        row.taxableAmount = Number(row.taxableAmount) || 0;
        row.cgstAmount = Number(row.cgstAmount) || 0;
        row.sgstAmount = Number(row.sgstAmount) || 0;
        row.igstAmount = Number(row.igstAmount) || 0;
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
        salesLedgerId,
        company_id
      FROM sales_vouchers
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

    const [rows] = await pool.execute(sql, params);



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
