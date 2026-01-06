const express = require("express");
const router = express.Router();
const pool = require("../db");

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

    const [voucherRows] = await pool.execute(sql, params);

    return res.status(200).json(voucherRows);
  } catch (err) {
    console.error("Failed to load sales vouchers:", err);
    return res.status(500).json({ message: err.message });
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
