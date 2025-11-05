const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/api/stock-summary', async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      stockGroupId,
      stockItemId,
      godownId,
      batchId,
      basis = 'Quantity',  // Quantity | Value | Cost
      showProfit = 'false',
      company_id,
      owner_type,
      owner_id,
    } = req.query;

    // Validate tenant info
    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: 'Missing tenant parameters (company_id, owner_type, owner_id)' });
    }

    const params = [];
    const filters = [];

    if (fromDate && toDate) {
      filters.push('vm.date BETWEEN ? AND ?');
      params.push(fromDate, toDate);
    }
    if (stockGroupId) {
      filters.push('si.stockGroupId = ?');
      params.push(stockGroupId);
    }
    if (stockItemId) {
      filters.push('si.id = ?');
      params.push(stockItemId);
    }
    if (godownId) {
      filters.push('ve.godownId = ?');
      params.push(godownId);
    }
    if (batchId) {
      filters.push('ve.batchId = ?');
      params.push(batchId);
    }

    // Tenant filters must be included in both voucher_main and ledgers if applicable
    // Assuming voucher_main has company and owner columns (adjust if needed)

    // Include tenant in voucher_main join, AND any other tables if applicable
    filters.push('vm.company_id = ?');
    filters.push('vm.owner_type = ?');
    filters.push('vm.owner_id = ?');
    params.push(company_id, owner_type, owner_id);

    const whereSql = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    // Aggregation of inward/outward from voucher_entries
    const sql = `
      SELECT 
  si.id as itemId,
  si.name,
  si.unit,
  si.stockGroupId,
  si.openingBalance,
  si.standardPurchaseRate,
  si.standardSaleRate,
  SUM(CASE WHEN ve.entry_type IN ('debit', 'destination') THEN svi.quantity ELSE 0 END) as inwardQty,
  SUM(CASE WHEN ve.entry_type IN ('credit', 'source') THEN svi.quantity ELSE 0 END) as outwardQty,
  SUM(CASE WHEN ve.entry_type IN ('debit', 'destination') THEN ve.amount ELSE 0 END) as inwardValue,
  SUM(CASE WHEN ve.entry_type IN ('credit', 'source') THEN ve.amount ELSE 0 END) as outwardValue
FROM stock_items si
LEFT JOIN voucher_entries ve ON ve.item_id IS NULL OR 1=1 -- exclude this from quantity sum
LEFT JOIN sales_voucher_items svi ON svi.voucherId = ve.voucher_id AND svi.itemId = si.id
LEFT JOIN voucher_main vm ON vm.id = ve.voucher_id
WHERE vm.date BETWEEN ? AND ?
  AND vm.company_id = ?
  AND vm.owner_type = ?
  AND vm.owner_id = ?
GROUP BY si.id, si.name, si.unit, si.stockGroupId, si.openingBalance, si.standardPurchaseRate, si.standardSaleRate
ORDER BY si.name;

    `;

    const [rows] = await pool.query(sql, params);

    const result = rows.map(row => {
      const inwardQty = Number(row.inwardQty) || 0;
      const outwardQty = Number(row.outwardQty) || 0;
      const openingBalance = Number(row.openingBalance) || 0;

      const closingQty = openingBalance + inwardQty - outwardQty;

      let closingValue = 0;
      if (basis === 'Cost') {
        closingValue = closingQty * (Number(row.standardPurchaseRate) || 0);
      } else if (basis === 'Value') {
        closingValue = closingQty * (Number(row.standardSaleRate) || 0);
      }

      let profit = 0;
      if (showProfit === 'true') {
        const saleValue = (Number(row.standardSaleRate) || 0) * outwardQty;
        const costValue = (Number(row.standardPurchaseRate) || 0) * outwardQty;
        profit = saleValue - costValue;
      }
      return {
        itemId: row.itemId,
        name: row.name,
        unit: row.unit,
        stockGroupId: row.stockGroupId,
        inwardQty,
        outwardQty,
        closingQty,
        closingValue,
        profit,
      };
    });

    res.json(result);

  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
