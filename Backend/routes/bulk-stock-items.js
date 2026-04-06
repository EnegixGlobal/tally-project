const express = require('express');
const multer = require('multer');
const csvParse = require('csv-parse').parse;
const fs = require('fs');
const router = express.Router();
const db = require('../db');

const upload = multer({ dest: 'uploads/' });

// Basic validation helper
const validateItem = (item) => {
  const errors = [];
  if (!item.name || typeof item.name !== "string" || !item.name.trim()) {
    errors.push("Name is required");
  }
  if (!item.unit || typeof item.unit !== "string" || !item.unit.trim()) {
    errors.push("Unit is required");
  }
  return errors;
};

// Helper: bulk insert function
async function bulkInsertItems(items, connection, companyId, ownerType, ownerId) {
  let successCount = 0;
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const validationErrors = validateItem(item);
    if (validationErrors.length > 0) {
      errors.push({ index: i, errors: validationErrors });
      continue;
    }

    const values = [
      item.name,
      item.stockGroupId || null,
      item.unit,
      item.openingBalance || 0,
      item.openingValue || 0,
      item.hsnCode || null,
      item.gstRate || 0,
      item.taxType || "Taxable",
      item.standardPurchaseRate || 0,
      item.standardSaleRate || 0,
      item.enableBatchTracking ? 1 : 0,
      item.allowNegativeStock ? 1 : 0,
      item.maintainInPieces ? 1 : 0,
      item.secondaryUnit || '',
      item.batchName || item.batchNumber || null,
      item.batchExpiryDate ? new Date(item.batchExpiryDate) : null,
      item.batchManufacturingDate ? new Date(item.batchManufacturingDate) : null,
      companyId,
      ownerType,
      ownerId,
      item.gstLedgerId || null,
      item.cgstLedgerId || null,
      item.sgstLedgerId || null,
      item.barcode || null
    ];

    try {
      const [result] = await connection.execute(
        `INSERT INTO stock_items
         (name, stockGroupId, unit, openingBalance, openingValue, hsnCode, gstRate, taxType,
          standardPurchaseRate, standardSaleRate, enableBatchTracking, allowNegativeStock,
          maintainInPieces, secondaryUnit, batchNumber, batchExpiryDate, batchManufacturingDate,
          company_id, owner_type, owner_id, gstLedgerId, cgstLedgerId, sgstLedgerId, barcode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values
      );

      const stockItemId = result.insertId;

      if (Array.isArray(item.godownAllocations)) {
        for (const alloc of item.godownAllocations) {
          await connection.execute(
            `INSERT INTO godown_allocations (stockItemId, godownId, quantity, value)
             VALUES (?, ?, ?, ?)`,
            [
              stockItemId,
              alloc.godownId || null,
              alloc.quantity || 0,
              alloc.value || 0
            ]
          );
        }
      }

      successCount++;
    } catch (err) {
      errors.push({ index: i, errors: ['Database insert error'], detail: err.message });
    }
  }

  return { successCount, errors };
}

// POST bulk insert JSON array
router.post('/bulk', async (req, res) => {
  const items = req.body;
  const companyId = req.query.company_id || req.body.companyId;
  const ownerType = req.query.owner_type || req.body.ownerType;
  const ownerId = req.query.owner_id || req.body.ownerId;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Request body must be a non-empty array" });
  }
  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ success: false, message: "companyId, ownerType, and ownerId are required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { successCount, errors } = await bulkInsertItems(items, connection, companyId, ownerType, ownerId);
    await connection.commit();
    res.json({
      success: true,
      message: `Processed ${items.length} items.`,
      inserted: successCount,
      skipped: items.length - successCount,
      errors,
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: "Internal server error during bulk insert", error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
