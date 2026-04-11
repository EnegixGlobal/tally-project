// b2c-api.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your configured MySQL connection pool

router.get('/b2c-customers', async (req, res) => {
  console.log('hit this route')
  try {
    const { company_id, owner_type, owner_id } = req.query;
    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }
    // Address fields are stored as text JSON or similar; adapt parsing in frontend if needed.
    const sql = `
      SELECT 
        l.id AS customerId,
        l.name AS customerName,
        l.email,
        l.phone,
        l.address, -- Full address text
        l.created_at AS registrationDate,
        l.created_at AS lastActivity, -- Placeholder for last activity; update logic per requirements
        '' AS dateOfBirth,
        '' AS gender,
        0 AS totalOrders,
        0 AS totalSpent,
        0 AS averageOrderValue,
        'regular' AS customerSegment,
        0 AS loyaltyPoints,
        '' AS preferences, -- Customize if storing preferences
        l.owner_type,
        l.owner_id,
        l.company_id,
        'low' AS riskProfile
      FROM ledgers l
      WHERE l.company_id = ?
        AND l.owner_type = ?
        AND l.owner_id = ?
        AND (l.gst_number IS NULL OR l.gst_number = '')
    `;
    const params = [company_id, owner_type, owner_id];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching B2C customers:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Fetch B2C transactions — join sales_vouchers and sales_voucher_items filtered by no GSTIN ledgers
router.get('/b2c-orders', async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, fromDate, toDate, customerId } = req.query;
    if (!company_id || !owner_type || !owner_id || !fromDate || !toDate) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const params = [company_id, owner_type, owner_id, fromDate, toDate];
    let extraWhere = '';
    if (customerId) {
      extraWhere = ' AND l.id = ? ';
      params.push(customerId);
    }

    const sql = `
      SELECT
  sv.id AS orderId,
  sv.number AS orderNumber,
  sv.date AS orderDate,
  sv.narration,
  sv.referenceNo,
  sv.subtotal AS totalAmount,
  sv.discountTotal AS discount,
  sv.cgstTotal + sv.sgstTotal + sv.igstTotal AS taxAmount,
  sv.total AS netAmount,
  sv.createdAt,
  sv.partyId AS customerId,
  l.name AS customerName,
  l.email,
  l.phone,
  l.address AS shippingAddress,
  l.gst_number AS gstNumber,
  svi.itemId,
  si.name AS itemName,
  si.unit,
  svi.quantity,
  svi.rate AS unitPrice,
  svi.discount,
  svi.amount,
  svi.cgstRate,
  svi.sgstRate,
  svi.igstRate,
  sv.destination,
  sv.dispatchThrough,
  sv.dispatchDocNo,
  sv.type AS paymentMethod,
  'paid' AS paymentStatus,
  '' AS source,
  0 AS loyaltyPointsEarned,
  0 AS loyaltyPointsUsed
FROM sales_vouchers sv
JOIN ledgers l ON sv.partyId = l.id
JOIN sales_voucher_items svi ON sv.id = svi.voucherId
JOIN stock_items si ON si.id = svi.itemId
WHERE sv.company_id = ?
  AND sv.owner_type = ?
  AND sv.owner_id = ?
  AND sv.date BETWEEN ? AND ?
  AND (l.gst_number IS NULL OR l.gst_number = '')
ORDER BY sv.date DESC, sv.number DESC, svi.id;
`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching B2C orders:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch B2C purchases — join purchase_vouchers and purchase_voucher_items filtered by no GSTIN ledgers
router.get('/b2c-purchases', async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, fromDate, toDate, supplierId } = req.query;
    if (!company_id || !owner_type || !owner_id || !fromDate || !toDate) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const params = [company_id, owner_type, owner_id, fromDate, toDate];
    let extraWhere = '';
    if (supplierId) {
      extraWhere = ' AND l.id = ? ';
      params.push(supplierId);
    }

    const sql = `
      SELECT
        pv.id AS orderId,
        pv.number AS orderNumber,
        pv.date AS orderDate,
        pv.narration,
        pv.referenceNo,
        pv.subtotal AS totalAmount,
        pv.discountTotal AS discount,
        pv.cgstTotal + pv.sgstTotal + pv.igstTotal AS taxAmount,
        pv.total AS netAmount,
        pv.date,
        pv.partyId AS supplierId,
        l.name AS supplierName,
        l.email,
        l.phone,
        l.address AS shippingAddress,
        l.gst_number AS gstNumber,
        pvi.itemId,
        si.name AS itemName,
        si.unit,
        pvi.quantity,
        pvi.rate AS unitPrice,
        pvi.discount,
        pvi.amount,
        pvi.cgstRate,
        pvi.sgstRate,
        pvi.igstRate,
        pv.destination,
        pv.dispatchThrough,
        pv.dispatchDocNo,
        '' AS paymentMethod,
        'paid' AS paymentStatus,
        '' AS source,
        0 AS loyaltyPointsEarned,
        0 AS loyaltyPointsUsed
      FROM purchase_vouchers pv
      JOIN ledgers l ON pv.partyId = l.id
      JOIN purchase_voucher_items pvi ON pv.id = pvi.voucherId
      JOIN stock_items si ON si.id = pvi.itemId
      WHERE pv.company_id = ?
        AND pv.owner_type = ?
        AND pv.owner_id = ?
        AND pv.date BETWEEN ? AND ?
        AND (l.gst_number IS NULL OR l.gst_number = '')
      ORDER BY pv.date DESC, pv.number DESC, pvi.id;
    `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching B2C purchases:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch B2C Large (B2CL) transactions - invoice value > 2.5 lakh
router.get('/b2cl', async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, fromDate, toDate } = req.query;
    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const params = [company_id, owner_type, owner_id];
    let dateFilter = '';

    if (fromDate && toDate) {
      dateFilter = ' AND sv.date BETWEEN ? AND ?';
      params.push(fromDate, toDate);
    }

    const sql = `
      SELECT
        sv.id AS voucherId,
        sv.number AS invoiceNumber,
        sv.date AS invoiceDate,
        COALESCE(sv.total, sv.subtotal, 0) AS invoiceValue,
        sv.subtotal AS taxableValue,
        sv.cgstTotal AS cgstAmount,
        sv.sgstTotal AS sgstAmount,
        sv.igstTotal AS igstAmount,
        COALESCE(NULLIF(sv.destination, ''), l.state, '') AS placeOfSupply,
        CASE 
          WHEN sv.igstTotal > 0 THEN 
            COALESCE((SELECT MAX(igstRate) FROM sales_voucher_items WHERE voucherId = sv.id AND igstRate > 0), 0)
          ELSE 0
        END AS igstRate,
        CASE 
          WHEN sv.cgstTotal > 0 THEN 
            COALESCE((SELECT MAX(cgstRate) FROM sales_voucher_items WHERE voucherId = sv.id AND cgstRate > 0), 0)
          ELSE 0
        END AS cgstRate,
        CASE 
          WHEN sv.sgstTotal > 0 THEN 
            COALESCE((SELECT MAX(sgstRate) FROM sales_voucher_items WHERE voucherId = sv.id AND sgstRate > 0), 0)
          ELSE 0
        END AS sgstRate,
        0 AS cessRate,
        0 AS cessAmount
      FROM sales_vouchers sv
      JOIN ledgers l ON sv.partyId = l.id
      WHERE sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?
        AND (l.gst_number IS NULL OR l.gst_number = '')
        AND COALESCE(sv.total, sv.subtotal, 0) >= 250000
        ${dateFilter}
      ORDER BY sv.date DESC, sv.number DESC;
    `;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching B2CL data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch B2C Small (B2CS) transactions - invoice value < 2.5 lakh
router.get('/b2c-small', async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, fromDate, toDate } = req.query;
    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const params = [company_id, owner_type, owner_id];
    let dateFilter = '';

    if (fromDate && toDate) {
      dateFilter = ' AND sv.date BETWEEN ? AND ?';
      params.push(fromDate, toDate);
    }

    const sql = `
      SELECT
        sv.id AS voucherId,
        sv.number AS invoiceNumber,
        sv.date AS invoiceDate,
        COALESCE(sv.total, sv.subtotal, 0) AS invoiceValue,
        sv.subtotal AS taxableValue,
        sv.cgstTotal AS cgstAmount,
        sv.sgstTotal AS sgstAmount,
        sv.igstTotal AS igstAmount,
        COALESCE(NULLIF(sv.destination, ''), l.state, '') AS placeOfSupply,
        CASE 
          WHEN sv.igstTotal > 0 THEN 
            COALESCE((SELECT MAX(igstRate) FROM sales_voucher_items WHERE voucherId = sv.id AND igstRate > 0), 0)
          ELSE 0
        END AS igstRate,
        CASE 
          WHEN sv.cgstTotal > 0 THEN 
            COALESCE((SELECT MAX(cgstRate) FROM sales_voucher_items WHERE voucherId = sv.id AND cgstRate > 0), 0)
          ELSE 0
        END AS cgstRate,
        CASE 
          WHEN sv.sgstTotal > 0 THEN 
            COALESCE((SELECT MAX(sgstRate) FROM sales_voucher_items WHERE voucherId = sv.id AND sgstRate > 0), 0)
          ELSE 0
        END AS sgstRate,
        0 AS cessRate,
        0 AS cessAmount
      FROM sales_vouchers sv
      JOIN ledgers l ON sv.partyId = l.id
      WHERE sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?
        AND (l.gst_number IS NULL OR l.gst_number = '')
        AND COALESCE(sv.total, sv.subtotal, 0) < 250000
        ${dateFilter}
      ORDER BY sv.date DESC, sv.number DESC;
    `;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching B2C Small data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET HSN Summary - Aggregated data from sale_history and sales_vouchers
router.get("/b2c/hsn-summary", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, fromDate, toDate } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required params: company_id, owner_type, owner_id",
      });
    }

    let dateFilter = '';

    if (fromDate && toDate) {
      dateFilter = ' AND sv.date BETWEEN ? AND ?';
    }

    // Get HSN grouped data by joining sales_voucher_items and stock_items
    const hsnSql = `
      -- Subquery/logic to extract Rate from rate columns (Handles both raw % and ledger IDs)
      WITH item_rates AS (
        SELECT 
          svi.id as item_id,
          svi.amount,
          svi.quantity,
          svi.hsnCode as svi_hsn,
          si.hsnCode as si_hsn,
          si.name as item_name,
          u.name as unit_name,
          si.unit as si_unit,
          svi.voucherId,
          -- Resolve IGST Rate (Check if > 40, then join ledger)
          CASE 
            WHEN COALESCE(svi.igstRate, 0) > 40 THEN (SELECT CAST(REGEXP_REPLACE(l1.name, '[^0-9.]', '') AS DECIMAL(10,2)) FROM ledgers l1 WHERE l1.id = svi.igstRate)
            ELSE COALESCE(svi.igstRate, 0) 
          END as resolvedIgstRate,
          -- Resolve CGST Rate
          CASE 
            WHEN COALESCE(svi.cgstRate, 0) > 40 THEN (SELECT CAST(REGEXP_REPLACE(l2.name, '[^0-9.]', '') AS DECIMAL(10,2)) FROM ledgers l2 WHERE l2.id = svi.cgstRate)
            ELSE COALESCE(svi.cgstRate, 0) 
          END as resolvedCgstRate,
          -- Resolve SGST Rate
          CASE 
            WHEN COALESCE(svi.sgstRate, 0) > 40 THEN (SELECT CAST(REGEXP_REPLACE(l3.name, '[^0-9.]', '') AS DECIMAL(10,2)) FROM ledgers l3 WHERE l3.id = svi.sgstRate)
            ELSE COALESCE(svi.sgstRate, 0) 
          END as resolvedSgstRate
        FROM sales_voucher_items svi
        JOIN stock_items si ON svi.itemId = si.id
        LEFT JOIN stock_units u ON si.unit = u.id
      )
      SELECT 
        COALESCE(ir.svi_hsn, ir.si_hsn, 'NA') as hsn,
        ir.item_name as label,
        COALESCE(ir.unit_name, ir.si_unit, 'NA') as uqc,
        SUM(ir.quantity) as count,
        SUM(ir.amount + 
            (ir.amount * ir.resolvedCgstRate / 100) + 
            (ir.amount * ir.resolvedSgstRate / 100) + 
            (ir.amount * ir.resolvedIgstRate / 100)
        ) as totalValue,
        SUM(ir.amount) as taxableValue,
        SUM(ir.amount * ir.resolvedIgstRate / 100) as igstAmount,
        SUM(ir.amount * ir.resolvedCgstRate / 100) as cgstAmount,
        SUM(ir.amount * ir.resolvedSgstRate / 100) as sgstAmount,
        (ir.resolvedIgstRate + ir.resolvedCgstRate + ir.resolvedSgstRate) as taxRate,
        0 as cessAmount
      FROM item_rates ir
      JOIN sales_vouchers sv ON ir.voucherId = sv.id
      WHERE sv.company_id = ? AND sv.owner_type = ? AND sv.owner_id = ?
        AND sv.date BETWEEN ? AND ?
      GROUP BY COALESCE(ir.svi_hsn, ir.si_hsn, 'NA'), ir.item_name, COALESCE(ir.unit_name, ir.si_unit, 'NA'), 
               ir.resolvedIgstRate, ir.resolvedCgstRate, ir.resolvedSgstRate
      ORDER BY ir.item_name ASC
    `;

    const [hsnRows] = await pool.execute(hsnSql, [
      company_id, owner_type, owner_id,
      ...(fromDate && toDate ? [fromDate, toDate] : [])
    ]);

    // Round values to 2 decimal places
    const roundValue = (val) => Math.round(Number(val) * 100) / 100;

    // Calculate overall totals for the "Total" row
    const totals = hsnRows.reduce((acc, row) => ({
      count: acc.count + (Number(row.count) || 0),
      totalValue: acc.totalValue + (Number(row.totalValue) || 0),
      taxableValue: acc.taxableValue + (Number(row.taxableValue) || 0),
      igstAmount: acc.igstAmount + (Number(row.igstAmount) || 0),
      cgstAmount: acc.cgstAmount + (Number(row.cgstAmount) || 0),
      sgstAmount: acc.sgstAmount + (Number(row.sgstAmount) || 0),
      cessAmount: acc.cessAmount + (Number(row.cessAmount) || 0)
    }), {
      count: 0, totalValue: 0, taxableValue: 0, igstAmount: 0, cgstAmount: 0, sgstAmount: 0, cessAmount: 0
    });

    const result = [
      ...hsnRows.map(row => ({
        ...row,
        count: roundValue(row.count),
        totalValue: roundValue(row.totalValue),
        taxableValue: roundValue(row.taxableValue),
        igstAmount: roundValue(row.igstAmount),
        cgstAmount: roundValue(row.cgstAmount),
        sgstAmount: roundValue(row.sgstAmount),
        cessAmount: roundValue(row.cessAmount)
      })),
      {
        label: 'Total',
        hsn: 'Total',
        uqc: 'NA',
        count: roundValue(totals.count),
        totalValue: roundValue(totals.totalValue),
        taxableValue: roundValue(totals.taxableValue),
        igstAmount: roundValue(totals.igstAmount),
        cgstAmount: roundValue(totals.cgstAmount),
        sgstAmount: roundValue(totals.sgstAmount),
        cessAmount: roundValue(totals.cessAmount)
      }
    ];

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("🔥 HSN Summary Fetch Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
