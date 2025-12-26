const express = require('express');
const router = express.Router();
const pool = require('../db');

function daysBetween(date1, date2) {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

router.get('/api/ageing-analysis', async (req, res) => {
  try {
    const {
      toDate,
      stockItemId,
      stockGroupId,
      godownId,
      batchId,
      basis = 'Quantity',
      showProfit = 'false',
      companyId,
      ownerType,
      ownerId,
    } = req.query;

    if (!toDate) {
      return res.status(400).json({ error: "'toDate' is required" });
    }
    if (!companyId || !ownerType || !ownerId) {
      return res.status(400).json({ error: "Missing tenant parameters" });
    }

    // Build WHERE filter clauses for stock_items
    const itemFilters = ['si.company_id = ?', 'si.owner_type = ?', 'si.owner_id = ?'];
    const itemParams = [companyId, ownerType, ownerId];

    if (stockItemId) {
      itemFilters.push('si.id = ?');
      itemParams.push(stockItemId);
    }
    if (stockGroupId) {
      itemFilters.push('si.stockGroupId = ?');
      itemParams.push(stockGroupId);
    }
    if (batchId) {
      itemFilters.push('si.batchNumber = ?');
      itemParams.push(batchId);
    }

    const itemWhereClause = `WHERE ${itemFilters.join(' AND ')}`;

    // Get all stock items with their current balances
    const itemsSql = `
      SELECT
        si.id AS item_id,
        si.name AS item_name,
        si.batchNumber,
        si.batchExpiryDate,
        si.openingBalance,
        si.standardPurchaseRate AS rate,
        -- Calculate current balance
        (COALESCE(si.openingBalance, 0) + 
         COALESCE(purchase_summary.totalInward, 0) - 
         COALESCE(sales_summary.totalOutward, 0)) AS currentBalance
      FROM stock_items si
      LEFT JOIN (
        SELECT 
          pvi.itemId,
          SUM(pvi.quantity) AS totalInward
        FROM purchase_voucher_items pvi
        JOIN purchase_vouchers pv ON pvi.voucherId = pv.id
        WHERE pv.date <= ?
          AND pv.company_id = ?
          AND pv.owner_type = ?
          AND pv.owner_id = ?
          ${godownId ? 'AND pvi.godownId = ?' : ''}
        GROUP BY pvi.itemId
      ) AS purchase_summary ON purchase_summary.itemId = si.id
      LEFT JOIN (
        SELECT 
          svi.itemId,
          SUM(svi.quantity) AS totalOutward
        FROM sales_voucher_items svi
        JOIN sales_vouchers sv ON svi.voucherId = sv.id
        WHERE sv.date <= ?
          AND sv.company_id = ?
          AND sv.owner_type = ?
          AND sv.owner_id = ?
          ${godownId ? 'AND svi.godownId = ?' : ''}
        GROUP BY svi.itemId
      ) AS sales_summary ON sales_summary.itemId = si.id
      ${itemWhereClause}
      ORDER BY si.id ASC
    `;

    // Get purchase transactions for ageing calculation
    const purchaseParams = [toDate, companyId, ownerType, ownerId];
    if (godownId) purchaseParams.push(godownId);
    
    const salesParams = [toDate, companyId, ownerType, ownerId];
    if (godownId) salesParams.push(godownId);
    
    const itemsParams = [...purchaseParams, ...salesParams, ...itemParams];
    const [itemsRows] = await pool.query(itemsSql, itemsParams);

    // Get purchase transactions for ageing
    const purchasesSql = `
      SELECT 
        pvi.itemId,
        pv.date AS purchase_date,
        pvi.quantity AS purchase_qty,
        pvi.rate AS purchase_rate
      FROM purchase_voucher_items pvi
      JOIN purchase_vouchers pv ON pvi.voucherId = pv.id
      WHERE pv.date <= ?
        AND pv.company_id = ?
        AND pv.owner_type = ?
        AND pv.owner_id = ?
        ${godownId ? 'AND pvi.godownId = ?' : ''}
        ${stockItemId ? 'AND pvi.itemId = ?' : ''}
      ORDER BY pv.date ASC, pvi.id ASC
    `;
    
    const purchaseDataParams = [toDate, companyId, ownerType, ownerId];
    if (godownId) purchaseDataParams.push(godownId);
    if (stockItemId) purchaseDataParams.push(stockItemId);
    
    const [purchaseRows] = await pool.query(purchasesSql, purchaseDataParams);

    // Combine items with purchases
    const rows = itemsRows.map(item => {
      const purchases = purchaseRows.filter(p => p.itemId === item.item_id);
      return { ...item, purchases };
    });

    const today = new Date(toDate);

    const ageingBuckets = [
      { label: '0-30 Days', from: 0, to: 30 },
      { label: '31-60 Days', from: 31, to: 60 },
      { label: '61-90 Days', from: 61, to: 90 },
      { label: '91-180 Days', from: 91, to: 180 },
      { label: 'Above 180 Days', from: 181, to: Infinity },
    ];

    const result = {};

    for (const row of rows) {
      const currentBalance = parseFloat(row.currentBalance) || 0;
      const rate = parseFloat(row.rate) || 0;
      
      result[row.item_id] = {
        item: {
          id: String(row.item_id),
          name: row.item_name,
          code: row.batchNumber || undefined,
        },
        ageing: ageingBuckets.map(b => ({ label: b.label, qty: 0, value: 0 })),
        totalQty: currentBalance,
        totalValue: currentBalance * rate,
      };

      // Process purchase transactions for ageing
      if (row.purchases && row.purchases.length > 0) {
        for (const purchase of row.purchases) {
          const ageDays = daysBetween(new Date(purchase.purchase_date), today);
          const bucket = ageingBuckets.find(b => ageDays >= b.from && ageDays <= b.to);
          if (bucket) {
            const idx = ageingBuckets.indexOf(bucket);
            const qty = parseFloat(purchase.purchase_qty) || 0;
            const purchaseRate = parseFloat(purchase.purchase_rate) || rate;
            const val = qty * purchaseRate;

            result[row.item_id].ageing[idx].qty += qty;
            result[row.item_id].ageing[idx].value += val;
          }
        }
      } else if (currentBalance > 0) {
        // If no purchase transactions but has balance (opening balance), put in oldest bucket
        const openingQty = parseFloat(row.openingBalance) || 0;
        if (openingQty > 0) {
          const idx = ageingBuckets.length - 1; // "Above 180 Days"
          const val = openingQty * rate;
          result[row.item_id].ageing[idx].qty += openingQty;
          result[row.item_id].ageing[idx].value += val;
        }
      }
    }

    // Filter out items with zero balance if needed, or return all
    const finalResult = Object.values(result).filter(item => item.totalQty > 0 || item.totalValue > 0);

    res.json(finalResult);
  } catch (err) {
    console.error('Error fetching ageing analysis:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
