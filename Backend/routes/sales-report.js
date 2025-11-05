const express = require('express');
const router = express.Router();
const pool = require('../db'); // mysql2 (promise) connection pool

router.get('/', async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      company_id,
      owner_type,
      owner_id,
      partyId = '',      // Optional party/ledger filter
      itemId = '',       // Optional item filter
      voucherType = '',  // Optional voucher type filter
      status = '',       // Optional status filter (for future)
      minNetAmount = '', // Optional amount lower bound
      maxNetAmount = '', // Optional amount upper bound
    } = req.query;

    // Validate tenancy
    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: 'Missing tenant parameters.' });
    }
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required.' });
    }

    let whereClauses = [
      "sv.company_id = ?",
      "sv.owner_type = ?",
      "sv.owner_id = ?",
      "sv.date >= ?",
      "sv.date <= ?"
    ];
    const params = [company_id, owner_type, owner_id, fromDate, toDate];

    if (partyId) {
      whereClauses.push("sv.partyId = ?");
      params.push(partyId);
    }
    if (itemId) {
      whereClauses.push("svi.itemId = ?");
      params.push(itemId);
    }
    if (voucherType) {
      whereClauses.push("sv.type = ?");
      params.push(voucherType);
    }

    // Base query: join sales_vouchers, party ledger, voucher items, item master
    // tax, discount, and amount breakdown at line item level for 'itemDetails' in frontend
    // PARTY: ledgers, ITEM: stock_items
    // Sales status is calculated in frontend

    const sql = `
      SELECT
        sv.id AS saleId,
        sv.number AS voucherNo,
        sv.type AS voucherType,
        sv.date,
        sv.referenceNo,
        l.id AS partyId,
        l.name AS partyName,
        l.gst_number AS partyGSTIN,
        sv.narration AS narration,
        
        svi.id AS itemEntryId,
        svi.itemId,
        si.name AS itemName,
        COALESCE(svi.hsnCode, si.hsnCode) AS hsnCode,
        svi.quantity,
        svi.rate,
        svi.amount,
        svi.discount,
        svi.cgstRate,
        svi.sgstRate,
        svi.igstRate,
        
        sv.subtotal,
        sv.cgstTotal,
        sv.sgstTotal,
        sv.igstTotal,
        sv.discountTotal,
        sv.total,
        
        sv.createdAt
      FROM sales_vouchers sv
      JOIN ledgers l      ON sv.partyId = l.id
      JOIN sales_voucher_items svi ON sv.id = svi.voucherId
      JOIN stock_items si  ON svi.itemId = si.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY sv.date DESC, sv.number DESC, svi.id
    `;
    console.log('SQL:', sql);

console.log('Params:', params);

    const [rows] = await pool.query(sql, params);

    // Optional net amount filters (apply in JS to avoid tricky SQL sums)
    let result = rows;
    if (minNetAmount) {
      result = result.filter(row => Number(row.total) >= parseFloat(minNetAmount));
    }
    if (maxNetAmount) {
      result = result.filter(row => Number(row.total) <= parseFloat(maxNetAmount));
    }

    // Group in response for easier frontend processing: per voucher (bill) with itemDetails
    // But send flat rows too, if frontend wants to group by itself
    // Each row can be used for detailed, partywise, itemwise etc.

    res.json(result);

  } catch (err) {
    console.error('Error fetching sales report:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
