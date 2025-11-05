const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your configured MySQL connection pool

router.get('/b2b-transactions', async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, fromDate, toDate, partyId } = req.query;

    if (!company_id || !owner_type || !owner_id || !fromDate || !toDate) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const params = [company_id, owner_type, owner_id, fromDate, toDate];
    let extraWhere = '';
    if (partyId) {
      extraWhere = ' AND sv.partyId = ? ';
      params.push(partyId);
    }

    // B2B means ledger with GST number
    const sql = `
      SELECT
        sv.id as voucherId,
        sv.number as voucherNo,
        sv.date,
        sv.narration,
        sv.referenceNo,
        sv.subtotal,
        sv.cgstTotal,
        sv.sgstTotal,
        sv.igstTotal,
        sv.discountTotal,
        sv.total,
        sv.createdAt,
        l.id as partyId,
        l.name as partyName,
        l.gst_number as partyGSTIN,
        si.id as itemId,
        si.name as itemName,
        COALESCE(svi.hsnCode, si.hsnCode) as hsnCode,
        svi.quantity,
        si.unit,
        svi.rate,
        svi.amount,
        svi.cgstRate,
        svi.sgstRate,
        svi.igstRate
      FROM sales_vouchers sv
      JOIN ledgers l ON sv.partyId = l.id
      JOIN sales_voucher_items svi ON sv.id = svi.voucherId
      JOIN stock_items si ON si.id = svi.itemId
      WHERE sv.company_id = ? AND sv.owner_type = ? AND sv.owner_id = ?
        AND sv.date BETWEEN ? AND ?
        AND l.gst_number IS NOT NULL AND l.gst_number != ''
        ${extraWhere}
      ORDER BY sv.date DESC, sv.number DESC, svi.id;
    `;

    const [rows] = await pool.query(sql, params);

    res.json(rows);

  } catch (err) {
    console.error('Error fetching B2B transactions:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/b2b-partners', async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;
    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const sql = `
      SELECT 
        id,
        name,
        gst_number AS gstin,
        email,
        phone,
        address,
        
        0 AS total_transactions,  -- you can join & calculate later if needed
        0 AS total_value,
        0 AS outstanding,
        0 AS credit_limit,
        'unknown' AS relationship,
        'active' AS status,
        'low' AS risk_rating,
        '' AS last_transaction,
        0 AS contract_value,
        '' AS loyalty_tier
      FROM ledgers
      WHERE company_id = ?
        AND owner_type = ?
        AND owner_id = ?
        AND gst_number IS NOT NULL
        AND gst_number <> ''
    `;
    const params = [company_id, owner_type, owner_id];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching partners:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
