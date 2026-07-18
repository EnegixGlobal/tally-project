const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your configured MySQL connection pool

router.get('/data', async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, financialYear } = req.query;

    if (!company_id || !owner_type || !owner_id || !financialYear) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    // Determine financial year date range
    // financialYear is something like '2026-27'
    const parts = financialYear.split('-');
    const startYear = parseInt(parts[0]);
    const endYear = startYear + 1;
    const fromDate = `${startYear}-04-01`;
    const toDate = `${endYear}-03-31`;

    const sql = `
      SELECT 
        CASE WHEN l.gst_number IS NOT NULL AND l.gst_number != '' THEN 'B2B' ELSE 'B2C' END as supplyType,
        SUM(svi.amount) as taxableValue,
        SUM(svi.amount * svi.cgstRate / 100) as centralTax,
        SUM(svi.amount * svi.sgstRate / 100) as stateTax,
        SUM(svi.amount * svi.igstRate / 100) as integratedTax
      FROM sales_vouchers sv
      JOIN sales_voucher_items svi ON sv.id = svi.voucherId
      JOIN ledgers l ON sv.partyId = l.id
      WHERE sv.company_id = ? AND sv.owner_type = ? AND sv.owner_id = ?
        AND sv.date BETWEEN ? AND ?
      GROUP BY supplyType
    `;

    const [rows] = await pool.query(sql, [company_id, owner_type, owner_id, fromDate, toDate]);

    // Format the response
    let b2c = { taxableValue: 0, centralTax: 0, stateTax: 0, integratedTax: 0, cess: 0 };
    let b2b = { taxableValue: 0, centralTax: 0, stateTax: 0, integratedTax: 0, cess: 0 };

    rows.forEach(row => {
      if (row.supplyType === 'B2B') {
        b2b.taxableValue = Number(row.taxableValue).toFixed(2);
        b2b.centralTax = Number(row.centralTax).toFixed(2);
        b2b.stateTax = Number(row.stateTax).toFixed(2);
        b2b.integratedTax = Number(row.integratedTax).toFixed(2);
      } else {
        b2c.taxableValue = Number(row.taxableValue).toFixed(2);
        b2c.centralTax = Number(row.centralTax).toFixed(2);
        b2c.stateTax = Number(row.stateTax).toFixed(2);
        b2c.integratedTax = Number(row.integratedTax).toFixed(2);
      }
    });

    res.json({ b2c, b2b });

  } catch (err) {
    console.error('Error fetching GSTR-9 data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
