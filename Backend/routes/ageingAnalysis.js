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

    // Build WHERE filter clauses & parameters for voucher_main and voucher_entries
    const filters = ['vm.date <= ?','vm.company_id = ?','vm.owner_type = ?','vm.owner_id = ?'];
    const params = [toDate, companyId, ownerType, ownerId];

    if (stockItemId) {
      filters.push('si.id = ?');
      params.push(stockItemId);
    }
    if (stockGroupId) {
      filters.push('si.stockGroupId = ?');
      params.push(stockGroupId);
    }
    if (godownId) {
      filters.push('vi.godownId = ?');
      params.push(godownId);
    }
    if (batchId) {
      filters.push('si.batchNumber = ?');
      params.push(batchId);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    // Union sales and purchase voucher items for quantity, rate, amount
    // Join voucher_main(vm), voucher_entries(ve), and item details (si)
    // "vi" is alias for sales_voucher_items or purchase_voucher_items combined as union

    const sql = `
      SELECT
        si.id AS item_id,
        si.name AS item_name,
        si.batchNumber,
        si.batchExpiryDate,
        MAX(vm.date) AS transaction_date,
        si.openingBalance AS quantity,
        si.standardPurchaseRate AS rate,
        SUM(COALESCE(vi.inwardQty,0)) AS inwardQty,
        SUM(COALESCE(vi.outwardQty,0)) AS outwardQty
      FROM stock_items si
      LEFT JOIN (
        SELECT
          svi.voucherId,
          svi.itemId,
          SUM(svi.quantity) AS inwardQty,
          0 AS outwardQty
        FROM sales_voucher_items svi
        GROUP BY svi.voucherId, svi.itemId
        UNION ALL
        SELECT
          pvi.voucherId,
          pvi.itemId,
          0 AS inwardQty,
          SUM(pvi.quantity) AS outwardQty
        FROM purchase_voucher_items pvi
        GROUP BY pvi.voucherId, pvi.itemId
      ) AS vi ON vi.itemId = si.id
      LEFT JOIN voucher_main vm ON vm.id = vi.voucherId
      ${whereClause}
      GROUP BY si.id, si.name, si.batchNumber, si.batchExpiryDate, si.openingBalance, si.standardPurchaseRate
      ORDER BY si.id ASC, transaction_date ASC
    `;

    const [rows] = await pool.query(sql, params);

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
      if (!row.transaction_date) continue;

      if (!result[row.item_id]) {
        result[row.item_id] = {
          item: {
            id: row.item_id,
            name: row.item_name,
            batchNumber: row.batchNumber,
            batchExpiryDate: row.batchExpiryDate,
          },
          ageing: ageingBuckets.map(b => ({ label: b.label, qty: 0, value: 0 })),
          totalQty: 0,
          totalValue: 0,
        };
      }

      const ageDays = daysBetween(new Date(row.transaction_date), today);
      const bucket = ageingBuckets.find(b => ageDays >= b.from && ageDays <= b.to);
      if (bucket) {
        const idx = ageingBuckets.indexOf(bucket);
        const qty = +row.quantity || 0;
        const val = basis === 'Cost'
          ? qty * (row.rate || 0)
          : qty * (row.rate || 0);  // Adjust calculation if ‘Value’ differs from rate usage

        result[row.item_id].ageing[idx].qty += qty;
        result[row.item_id].ageing[idx].value += val;
        result[row.item_id].totalQty += qty;
        result[row.item_id].totalValue += val;
      }
    }

    res.json(Object.values(result));
  } catch (err) {
    console.error('Error fetching ageing analysis:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
