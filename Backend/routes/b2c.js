// b2c-api.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your configured MySQL connection pool

router.get('/b2c-customers', async (req, res) => {
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
        COALESCE(sv.destination, '') AS placeOfSupply,
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
        COALESCE(sv.destination, '') AS placeOfSupply,
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

module.exports = router;
