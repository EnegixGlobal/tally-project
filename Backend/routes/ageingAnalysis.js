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

    // Get distinct item+godown combinations from transactions
    // This ensures we show separate rows for same item in different godowns
    const itemGodownCombinationsSql = `
      SELECT DISTINCT
        si.id AS item_id,
        si.name AS item_name,
        si.batchNumber,
        si.batchExpiryDate,
        si.openingBalance,
        si.standardPurchaseRate AS rate,
        COALESCE(pvi.godownId, COALESCE(svi.godownId, 0)) AS godown_id
      FROM stock_items si
      LEFT JOIN purchase_voucher_items pvi ON pvi.itemId = si.id
      LEFT JOIN purchase_vouchers pv ON pvi.voucherId = pv.id 
        AND pv.date <= ? 
        AND pv.company_id = ? 
        AND pv.owner_type = ? 
        AND pv.owner_id = ?
        ${godownId ? 'AND pvi.godownId = ?' : ''}
      LEFT JOIN sales_voucher_items svi ON svi.itemId = si.id
      LEFT JOIN sales_vouchers sv ON svi.voucherId = sv.id 
        AND sv.date <= ? 
        AND sv.company_id = ? 
        AND sv.owner_type = ? 
        AND sv.owner_id = ?
        ${godownId ? 'AND svi.godownId = ?' : ''}
      ${itemWhereClause}
      HAVING godown_id > 0 OR si.openingBalance > 0
      ORDER BY si.id ASC, godown_id ASC
    `;

    // Build params for combinations query
    const combinationsParams = [
      toDate, companyId, ownerType, ownerId,  // for purchase_vouchers join
      ...(godownId ? [godownId] : []),
      toDate, companyId, ownerType, ownerId,  // for sales_vouchers join
      ...(godownId ? [godownId] : []),
      ...itemParams
    ];
    const [itemsRows] = await pool.query(itemGodownCombinationsSql, combinationsParams);

    // Get purchase transactions for ageing, including godownId
    const purchasesSql = `
      SELECT 
        pvi.itemId,
        COALESCE(pvi.godownId, 0) AS godown_id,
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

    // Get sales transactions to calculate current balance per item+godown
    const salesSql = `
      SELECT 
        svi.itemId,
        COALESCE(svi.godownId, 0) AS godown_id,
        SUM(svi.quantity) AS totalOutward
      FROM sales_voucher_items svi
      JOIN sales_vouchers sv ON svi.voucherId = sv.id
      WHERE sv.date <= ?
        AND sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?
        ${godownId ? 'AND svi.godownId = ?' : ''}
        ${stockItemId ? 'AND svi.itemId = ?' : ''}
      GROUP BY svi.itemId, svi.godownId
    `;
    
    const salesParams = [toDate, companyId, ownerType, ownerId];
    if (godownId) salesParams.push(godownId);
    if (stockItemId) salesParams.push(stockItemId);
    
    const [salesRows] = await pool.query(salesSql, salesParams);

    // Combine items with purchases and calculate balances
    const rows = itemsRows.map(item => {
      const purchases = purchaseRows.filter(p => 
        p.itemId === item.item_id && p.godown_id == item.godown_id
      );
      
      // Calculate current balance for this item+godown
      const totalInward = purchases.reduce((sum, p) => sum + parseFloat(p.purchase_qty || 0), 0);
      const salesRow = salesRows.find(s => s.itemId === item.item_id && s.godown_id == item.godown_id);
      const totalOutward = salesRow ? parseFloat(salesRow.totalOutward || 0) : 0;
      const openingQty = parseFloat(item.openingBalance || 0);
      const currentBalance = openingQty + totalInward - totalOutward;
      
      return { 
        ...item, 
        purchases,
        currentBalance,
        totalInward,
        totalOutward
      };
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
      // Use composite key: item_id + godown_id to separate same item in different godowns
      const compositeKey = `${row.item_id}_${row.godown_id || 0}`;
      const currentBalance = parseFloat(row.currentBalance) || 0;
      const rate = parseFloat(row.rate) || 0;
      
      // Skip if no balance and no purchases
      if (currentBalance <= 0 && (!row.purchases || row.purchases.length === 0)) {
        continue;
      }
      
      result[compositeKey] = {
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

            result[compositeKey].ageing[idx].qty += qty;
            result[compositeKey].ageing[idx].value += val;
          }
        }
      }
      
      // If we have current balance but no purchases, use opening balance for ageing
      if (currentBalance > 0 && (!row.purchases || row.purchases.length === 0)) {
        const openingQty = parseFloat(row.openingBalance) || 0;
        if (openingQty > 0) {
          const idx = ageingBuckets.length - 1; // "Above 180 Days"
          const val = openingQty * rate;
          result[compositeKey].ageing[idx].qty += openingQty;
          result[compositeKey].ageing[idx].value += val;
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
