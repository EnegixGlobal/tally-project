const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all stock items (scoped)
router.get('/', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }

  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT 
        s.id,
        s.name,
        s.stockGroupId,
        sg.name AS stockGroupName,
        s.unit,
        u.name AS unitName,
        s.openingBalance,
        s.hsnCode,
        s.gstRate,
        s.batchNumber,
        s.batchExpiryDate,
        s.batchManufacturingDate,
        s.taxType,
        s.barcode
      FROM stock_items s
      LEFT JOIN stock_groups sg ON s.stockGroupId = sg.id
      LEFT JOIN stock_units u ON s.unit = u.id
      WHERE s.company_id = ? AND s.owner_type = ? AND s.owner_id = ?
    `, [company_id, owner_type, owner_id]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("🔥 Error fetching stock items:", err);
    res.status(500).json({ success: false, message: 'Error fetching stock items' });
  } finally {
    connection.release();
  }
});


// POST save stock item (scoped)
router.post('/', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      name, stockGroupId, unit, openingBalance, openingValue,
      hsnCode, gstRate, taxType, standardPurchaseRate, standardSaleRate,
      enableBatchTracking, allowNegativeStock, maintainInPieces, secondaryUnit,
      batchName, batchExpiryDate, batchManufacturingDate,
      godownAllocations = [],
      companyId, ownerType, ownerId, barcode

    } = req.body;

    if (!companyId || !ownerType || !ownerId) {
      return res.status(400).json({ message: 'companyId, ownerType, and ownerId are required.' });
    }

    const values = [
      name, stockGroupId ?? null, unit ?? null,
      openingBalance ?? 0, openingValue ?? 0, hsnCode ?? null, gstRate ?? 0,
      taxType ?? 'Taxable', standardPurchaseRate ?? 0, standardSaleRate ?? 0,
      enableBatchTracking ? 1 : 0, allowNegativeStock ? 1 : 0,
      maintainInPieces ? 1 : 0, secondaryUnit ?? null,
      batchName ?? null, batchExpiryDate ?? null, batchManufacturingDate ?? null,
      companyId, ownerType, ownerId, barcode
    ];

    // Insert stock item with tenant+role scope
    const [result] = await connection.execute(`
      INSERT INTO stock_items (
        name, stockGroupId, unit, openingBalance, openingValue,
        hsnCode, gstRate, taxType, standardPurchaseRate, standardSaleRate,
        enableBatchTracking, allowNegativeStock, maintainInPieces, secondaryUnit,
        batchNumber, batchExpiryDate, batchManufacturingDate,
        company_id, owner_type, owner_id, barcode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, values);

    const stockItemId = result.insertId;

    // Insert godown allocations for this stock item
    for (const alloc of godownAllocations) {
      await connection.execute(`
        INSERT INTO godown_allocations (stockItemId, godownId, quantity, value)
        VALUES (?, ?, ?, ?)
      `, [
        stockItemId,
        alloc.godownId ?? null,
        alloc.quantity ?? 0,
        alloc.value ?? 0
      ]);
    }

    await connection.commit();
    res.json({ success: true, message: 'Stock item saved successfully' });

  } catch (err) {
    console.error("🔥 Error saving stock item:", err);
    await connection.rollback();
    res.status(500).json({ success: false, message: 'Error saving stock item' });
  } finally {
    connection.release();
  }
});

// GET item details by barcode
router.get('/barcode/:barcode', async (req, res) => {
  const { barcode } = req.params;
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT 
        s.id, s.name, s.stockGroupId, s.unit, s.openingBalance,
        s.hsnCode, s.gstRate, s.taxType, s.barcode,
        sg.name AS stockGroupName,
        u.name AS unitName
      FROM stock_items s
      LEFT JOIN stock_groups sg ON s.stockGroupId = sg.id
      LEFT JOIN stock_units u ON s.unit = u.id
      WHERE s.barcode = ?`, [barcode]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Item not found.' });
    } else {
      res.json({ success: true, data: rows[0] });
    }
  } catch (err) {
    console.error("🔥 Error fetching item by barcode:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
});

module.exports = router;
