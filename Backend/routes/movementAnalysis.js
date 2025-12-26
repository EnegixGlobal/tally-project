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

// GET /api/stock-movements - Returns stock movements with batch details
router.get('/api/stock-movements', async (req, res) => {
  try {
    const { itemId, fromDate, toDate, company_id, owner_type, owner_id } = req.query;

    if (!itemId) {
      return res.status(400).json({ error: "'itemId' is required" });
    }
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "'fromDate' and 'toDate' are required" });
    }
    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: "'company_id', 'owner_type', and 'owner_id' are required" });
    }

    // Convert itemId to number for SQL query
    const itemIdNum = parseInt(itemId, 10);
    if (isNaN(itemIdNum)) {
      return res.status(400).json({ error: 'Invalid itemId format' });
    }


    // Get stock item details including batches
    const [stockItemRows] = await pool.query(
      `SELECT id, name, batches FROM stock_items WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?`,
      [itemIdNum, company_id, owner_type, owner_id]
    );

    if (stockItemRows.length === 0) {
      return res.status(404).json({ error: 'Stock item not found' });
    }

    const stockItem = stockItemRows[0];
    let itemBatches = [];
    try {
      itemBatches = stockItem.batches ? JSON.parse(stockItem.batches) : [];
    } catch (e) {
      itemBatches = [];
    }

    // Create a map of batchName to batch details for quick lookup
    const batchMap = new Map();
    itemBatches.forEach(batch => {
      const batchName = batch.batchName || batch.batchNumber || '';
      batchMap.set(batchName, {
        batchName: batchName,
        manufacturingDate: batch.batchManufacturingDate || null,
        expiryDate: batch.batchExpiryDate || null,
      });
    });

    // Query purchase history (using purchase_history table)
    // Note: purchase_history has batchNumber, purchaseQuantity, purchaseDate, rate, itemName, voucherNumber
    // We match by itemName since purchase_history doesn't have itemId
    const purchaseSQL = `
      SELECT 
        ph.purchaseDate AS date,
        COALESCE(ph.voucherNumber, CONCAT('PH-', ph.id)) AS voucherNumber,
        'Purchase' AS voucherType,
        COALESCE(ph.batchNumber, '') AS batchNumber,
        ph.purchaseQuantity AS quantity,
        ph.rate
      FROM purchase_history ph
      WHERE ph.itemName = ?
        AND ph.purchaseDate BETWEEN ? AND ?
        AND ph.companyId = ?
        AND ph.ownerType = ?
        AND ph.ownerId = ?
      ORDER BY ph.purchaseDate ASC, ph.id ASC
    `;

    const [purchaseRows] = await pool.query(purchaseSQL, [
      stockItem.name, fromDate, toDate, company_id, owner_type, owner_id
    ]);
    

    // Query sales history (using sale_history table)
    // Note: sale_history has batchNumber, qtyChange, movementDate, rate, itemName
    // We match by itemName since sale_history doesn't have itemId
    const salesSQL = `
      SELECT 
        sh.movementDate AS date,
        CONCAT('SH-', sh.id) AS voucherNumber,
        'Sales' AS voucherType,
        COALESCE(sh.batchNumber, '') AS batchNumber,
        ABS(sh.qtyChange) AS quantity,
        sh.rate
      FROM sale_history sh
      WHERE sh.itemName = ?
        AND sh.movementDate BETWEEN ? AND ?
        AND sh.companyId = ?
        AND sh.ownerType = ?
        AND sh.ownerId = ?
      ORDER BY sh.movementDate ASC, sh.id ASC
    `;

    const [salesRows] = await pool.query(salesSQL, [
      stockItem.name, fromDate, toDate, company_id, owner_type, owner_id
    ]);
    

    // Combine and group by voucher
    const allRows = [...purchaseRows, ...salesRows];
    
    // Group by voucher (date + voucherType + voucherNumber)
    const voucherMap = new Map();
    
    allRows.forEach(row => {
      const key = `${row.date}_${row.voucherType}_${row.voucherNumber}`;
      
      if (!voucherMap.has(key)) {
        voucherMap.set(key, {
          date: row.date,
          stockItemName: stockItem.name,
          voucherType: row.voucherType,
          voucherNumber: row.voucherNumber,
          batches: []
        });
      }
      
      const voucher = voucherMap.get(key);
      const batchNumber = row.batchNumber || '';
      const batchInfo = batchMap.get(batchNumber) || { batchName: batchNumber, manufacturingDate: null, expiryDate: null };
      
      voucher.batches.push({
        batchName: batchInfo.batchName || batchNumber || '-',
        quantity: Number(row.quantity) || 0,
        rate: Number(row.rate) || 0,
        manufacturingDate: batchInfo.manufacturingDate || null,
        expiryDate: batchInfo.expiryDate || null,
      });
    });

    // Convert map to array and sort by date
    const result = Array.from(voucherMap.values()).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.voucherNumber.localeCompare(b.voucherNumber);
    });
    res.json({ data: result });
  } catch (err) {
    console.error("❌ Error querying stock movements:", err);
    console.error("❌ Error stack:", err.stack);
    console.error("❌ Error details:", {
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;
