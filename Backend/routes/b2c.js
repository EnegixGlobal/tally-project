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

module.exports = router;
