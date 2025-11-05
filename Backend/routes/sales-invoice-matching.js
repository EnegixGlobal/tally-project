const express = require('express');
const router = express.Router();
const pool = require('../db'); // your mysql2 promise pool

router.get('/', async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      company_id,
      owner_type,
      owner_id,
      partyId = '',
      invoiceType = '',
      matchingStatus = '',
      gstr1Status = '',
      gstr2Status = '',
      eInvoiceStatus = '',
      ewayStatus = '',
      minAmount = '',
      maxAmount = ''
    } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: 'Missing tenant parameters.' });
    }
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate required.' });
    }

    const whereClauses = [
      'sv.company_id = ?',
      'sv.owner_type = ?',
      'sv.owner_id = ?',
      'sv.date >= ?',
      'sv.date <= ?'
    ];
    const params = [company_id, owner_type, owner_id, fromDate, toDate];

    if (partyId) {
      whereClauses.push('sv.partyId = ?');
      params.push(partyId);
    }

    // Note: invoiceType, matchingStatus, gstr1Status, etc are frontend-only (computed),
    // so backend does not filter them unless you maintain those states server-side.

    const sql = `
      SELECT
        sv.id AS voucherId,
        sv.number AS voucherNo,
        sv.date,
        sv.narration,
        sv.referenceNo,
        sv.createdAt,
        l.id AS partyId,
        l.name AS partyName,
        l.gst_number AS partyGSTIN,
        '' AS partyState,  -- removed actual l.state since it does not exist
        si.id AS itemId,
        si.name AS itemName,
        COALESCE(svi.hsnCode, si.hsnCode) AS hsnCode,
        svi.quantity,
        si.unit,
        svi.rate,
        svi.amount,
        svi.cgstRate,
        svi.sgstRate,
        svi.igstRate,
        sv.subtotal,
        sv.cgstTotal,
        sv.sgstTotal,
        sv.igstTotal,
        sv.discountTotal,
        sv.total
      FROM sales_vouchers sv
      JOIN ledgers l ON sv.partyId = l.id
      JOIN sales_voucher_items svi ON sv.id = svi.voucherId
      JOIN stock_items si ON svi.itemId = si.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY sv.date DESC, sv.number DESC, svi.id
    `;


    const [rows] = await pool.query(sql, params);

    // Optional amount filtering on aggregate 'total'
    let filtered = rows;
    if (minAmount) filtered = filtered.filter(r => Number(r.total) >= parseFloat(minAmount));
    if (maxAmount) filtered = filtered.filter(r => Number(r.total) <= parseFloat(maxAmount));

    res.json(filtered);

  } catch (error) {
    console.error('Error fetching sales invoice matching:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
