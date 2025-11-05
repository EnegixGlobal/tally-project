const express = require('express');
const router = express.Router();
const pool = require('../db'); // mysql2 pool with promises

router.get('/api/movement-analysis', async (req, res) => {
  try {
    const { fromDate, toDate, stockItemId, companyId, ownerType, ownerId } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "'fromDate' and 'toDate' are required" });
    }
    if (!companyId || !ownerType || !ownerId) {
      return res.status(400).json({ error: "'companyId', 'ownerType', and 'ownerId' are required" });
    }

    const paramsForPurchase = [fromDate, toDate, companyId, ownerType, ownerId];
    let purchaseItemFilter = '';
    if (stockItemId) {
      purchaseItemFilter = 'AND pvi.itemId = ?';
      paramsForPurchase.push(stockItemId);
    }
    const purchaseSQL = `
      SELECT 
        pv.date AS date,
        'Purchase Voucher' AS voucherType,
        pv.number AS voucherNumber,
        pvi.itemId AS stockItemId,
        it.name AS stockItemName,
        pvi.quantity AS inwardQty,
        0 AS outwardQty,
        pvi.rate,
        pvi.amount AS value,
        pvi.godownId
      FROM purchase_vouchers pv
      JOIN purchase_voucher_items pvi ON pv.id = pvi.voucherId
      JOIN stock_items it ON pvi.itemId = it.id
      WHERE pv.date BETWEEN ? AND ?
        AND pv.company_id = ?
        AND pv.owner_type = ?
        AND pv.owner_id = ?
        ${purchaseItemFilter}
    `;

    const paramsForSales = [fromDate, toDate, companyId, ownerType, ownerId];
    let salesItemFilter = '';
    if (stockItemId) {
      salesItemFilter = 'AND svi.itemId = ?';
      paramsForSales.push(stockItemId);
    }
    const salesSQL = `
      SELECT 
        sv.date AS date,
        'Sales Voucher' AS voucherType,
        sv.number AS voucherNumber,
        svi.itemId AS stockItemId,
        it.name AS stockItemName,
        0 AS inwardQty,
        svi.quantity AS outwardQty,
        svi.rate,
        svi.amount AS value,
        svi.godownId
      FROM sales_vouchers sv
      JOIN sales_voucher_items svi ON sv.id = svi.voucherId
      JOIN items it ON svi.itemId = it.id
      WHERE sv.date BETWEEN ? AND ?
        AND sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?
        ${salesItemFilter}
    `;

    // You could similarly add other voucher types like stock journals, delivery items, etc.

    const fullSQL = `
      (${purchaseSQL})
      UNION ALL
      (${salesSQL})
      ORDER BY date ASC, voucherType ASC, voucherNumber ASC
    `;

    // Combine all params in order for UNION ALL
    const combinedParams = [...paramsForPurchase, ...paramsForSales];

    const [rows] = await pool.query(fullSQL, combinedParams);

    res.json(rows);
  } catch (err) {
    console.error("Error querying movement analysis:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
