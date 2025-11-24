const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all stock items (scoped)
router.get("/", async (req, res) => {
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
        s.barcode,
        s.batches  -- Added missing comma here
      FROM stock_items s
      LEFT JOIN stock_groups sg ON s.stockGroupId = sg.id
      LEFT JOIN stock_units u ON s.unit = u.id
      ORDER BY s.id DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("🔥 Error fetching stock items:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching stock items" });
  } finally {
    connection.release();
  }
});

// POST save stock item (scoped)
// router.post('/', async (req, res) => {
//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     const {
//       name, stockGroupId, unit, openingBalance, openingValue,
//       hsnCode, gstRate, taxType, standardPurchaseRate, standardSaleRate,
//       enableBatchTracking, allowNegativeStock, maintainInPieces, secondaryUnit,
//       batchName, batchExpiryDate, batchManufacturingDate,
//       godownAllocations = [],
//       barcode
//     } = req.body;

//     const values = [
//       name, stockGroupId ?? null, unit ?? null,
//       openingBalance ?? 0, openingValue ?? 0, hsnCode ?? null, gstRate ?? 0,
//       taxType ?? 'Taxable', standardPurchaseRate ?? 0, standardSaleRate ?? 0,
//       enableBatchTracking ? 1 : 0, allowNegativeStock ? 1 : 0,
//       maintainInPieces ? 1 : 0, secondaryUnit ?? null,
//       batchName ?? null, batchExpiryDate ?? null, batchManufacturingDate ?? null,
//       barcode
//     ];

//     const [result] = await connection.execute(`
//       INSERT INTO stock_items (
//         name, stockGroupId, unit, openingBalance, openingValue,
//         hsnCode, gstRate, taxType, standardPurchaseRate, standardSaleRate,
//         enableBatchTracking, allowNegativeStock, maintainInPieces, secondaryUnit,
//         batchNumber, batchExpiryDate, batchManufacturingDate, barcode
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, values);

//     const stockItemId = result.insertId;

//     for (const alloc of godownAllocations) {
//       await connection.execute(`
//         INSERT INTO godown_allocations (stockItemId, godownId, quantity, value)
//         VALUES (?, ?, ?, ?)
//       `, [
//         stockItemId,
//         alloc.godownId ?? null,
//         alloc.quantity ?? 0,
//         alloc.value ?? 0
//       ]);
//     }

//     await connection.commit();
//     res.json({ success: true, message: 'Stock item saved successfully' });

//   } catch (err) {
//     console.error("🔥 Error saving stock item:", err);
//     await connection.rollback();
//     res.status(500).json({ success: false, message: 'Error saving stock item' });
//   } finally {
//     connection.release();
//   }
// });

router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      stockGroupId,
      unit,
      openingBalance,
      openingValue,
      hsnCode,
      gstRate,
      taxType,
      standardPurchaseRate,
      standardSaleRate,
      enableBatchTracking,
      allowNegativeStock,
      maintainInPieces,
      secondaryUnit,
      batches = [], 
      godownAllocations = [],
      barcode,
      ownerType = "employee",
      ownerId,
    } = req.body;



    if (!name || !unit || !taxType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, unit, or taxType",
      });
    }

    if (
      enableBatchTracking &&
      (!Array.isArray(batches) ||
        batches.some(
          (batch) =>
            !batch.batchName ||
            batch.batchQuantity == null ||
            isNaN(batch.batchQuantity) ||
            batch.batchRate == null ||
            isNaN(batch.batchRate) ||
            !batch.batchExpiryDate ||
            !batch.batchManufacturingDate
        ))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch data. Fix missing or invalid fields",
      });
    }

    // Convert string → number & format properly
    const batchData = batches.map((batch) => ({
      batchName: batch.batchName,
      batchQuantity: Number(batch.batchQuantity),
      batchRate: Number(batch.batchRate),
      batchExpiryDate: batch.batchExpiryDate,
      batchManufacturingDate: batch.batchManufacturingDate,
    }));


    const [columnsResult] = await connection.execute(`
      SHOW COLUMNS FROM stock_items
    `);

    const columnNames = columnsResult
      .filter((col) => col.Field !== "id" && col.Field !== "company_id")
      .map((col) => col.Field);

    const values = columnNames.map((column) => {
      switch (column) {
        case "name":
          return name;
        case "stockGroupId":
          return stockGroupId ?? null;
        case "unit":
          return unit ?? null;
        case "openingBalance":
          return openingBalance ?? 0;
        case "openingValue":
          return openingValue ?? 0;
        case "hsnCode":
          return hsnCode ?? null;
        case "gstRate":
          return gstRate ?? 0;
        case "taxType":
          return taxType;
        case "standardPurchaseRate":
          return standardPurchaseRate ?? 0;
        case "standardSaleRate":
          return standardSaleRate ?? 0;
        case "enableBatchTracking":
          return enableBatchTracking ? 1 : 0;
        case "allowNegativeStock":
          return allowNegativeStock ? 1 : 0;
        case "maintainInPieces":
          return maintainInPieces ? 1 : 0;
        case "secondaryUnit":
          return secondaryUnit ?? null;
        case "barcode":
          return barcode;
        case "owner_type":
          return ownerType;
        case "owner_id":
          return ownerId ?? null;
        case "batches":
          return JSON.stringify(batchData);
        default:
          return null;
      }
    });

    const placeholders = columnNames.map(() => "?").join(", ");
    const insertQuery = `
      INSERT INTO stock_items (${columnNames.join(", ")})
      VALUES (${placeholders})
    `;

    const [result] = await connection.execute(insertQuery, values);
    const stockItemId = result.insertId;

    await connection.commit();

    res.json({
      success: true,
      message: "Stock item saved successfully",
      stockItemId: stockItemId,
      batchesInserted: batches.length,
      batchDetails: batchData,
    });
  } catch (err) {
    console.error("🔥 Error saving stock item:", err);
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: "Error saving stock item",
      error: err.message,
    });
  } finally {
    connection.release();
  }
});


// GET item details by barcode
router.get("/barcode/:barcode", async (req, res) => {
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
      WHERE s.barcode = ?`,
      [barcode]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Item not found." });
    } else {
      res.json({ success: true, data: rows[0] });
    }
  } catch (err) {
    console.error("🔥 Error fetching item by barcode:", err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    connection.release();
  }
});

// Deleter Request
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Step 1: check if item exists
    const [check] = await connection.execute(
      "SELECT id FROM stock_items WHERE id = ?",
      [id]
    );

    if (check.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Stock item not found" });
    }

    // Step 2: delete godown allocations linked to this stock item
    await connection.execute(
      "DELETE FROM godown_allocations WHERE stockItemId = ?",
      [id]
    );

    // Step 3: delete the stock item itself
    await connection.execute("DELETE FROM stock_items WHERE id = ?", [id]);

    await connection.commit();
    res.json({ success: true, message: "Stock item deleted successfully" });
  } catch (err) {
    console.error("🔥 Error deleting stock item:", err);
    await connection.rollback();
    res
      .status(500)
      .json({ success: false, message: "Error deleting stock item" });
  } finally {
    connection.release();
  }
});

//put item
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      name,
      stockGroupId,
      unit,
      openingBalance,
      openingValue,
      hsnCode,
      gstRate,
      taxType,
      standardPurchaseRate,
      standardSaleRate,
      enableBatchTracking,
      allowNegativeStock,
      maintainInPieces,
      secondaryUnit,
      batches = [],
      barcode,
      ownerType = "employee",
      ownerId,
    } = req.body;

    if (!name || !unit || !taxType) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const batchData = enableBatchTracking
      ? batches.map((batch) => ({
          batchName: batch.batchName || "",
          batchQuantity: Number(batch.batchQuantity) || 0,
          batchRate: Number(batch.batchRate) || 0,
          batchExpiryDate: batch.batchExpiryDate || null,
          batchManufacturingDate: batch.batchManufacturingDate || null,
        }))
      : [];

    const updateQuery = `
      UPDATE stock_items SET 
        name=?, stockGroupId=?, unit=?, openingBalance=?, openingValue=?,
        hsnCode=?, gstRate=?, taxType=?, standardPurchaseRate=?, standardSaleRate=?,
        enableBatchTracking=?, allowNegativeStock=?, maintainInPieces=?, secondaryUnit=?,
        batches=?, barcode=?, owner_type=?, owner_id=?
      WHERE id=?
    `;

    const values = [
      name,
      stockGroupId ?? null,
      unit ?? null,
      openingBalance ?? 0,
      openingValue ?? 0,
      hsnCode ?? null,
      gstRate ?? 0,
      taxType ?? "Taxable",
      standardPurchaseRate ?? 0,
      standardSaleRate ?? 0,
      enableBatchTracking ? 1 : 0,
      allowNegativeStock ? 1 : 0,
      maintainInPieces ? 1 : 0,
      secondaryUnit ?? null,
      JSON.stringify(batchData),
      barcode,
      ownerType,
      ownerId ?? null,
      id,
    ];

    await connection.execute(updateQuery, values);

    await connection.commit();

    return res.json({
      success: true,
      message: "Stock item updated successfully!",
      id,
      batches: batchData,
    });

  } catch (err) {
    await connection.rollback();
    console.error("🔥 Update Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error updating stock item",
      error: err.message,
    });
  } finally {
    connection.release();
  }
});


//single get

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Stock item ID is required" });
  }

  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      `
      SELECT 
        s.*,
        sg.name AS stockGroupName,
        u.name AS unitName
      FROM stock_items s
      LEFT JOIN stock_groups sg ON s.stockGroupId = sg.id
      LEFT JOIN stock_units u ON s.unit = u.id
      WHERE s.id = ?
    `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Stock item not found" });
    }

    const item = rows[0];

    // If batches are returned as a string, parse it into an array
    const batches = item.batches ? JSON.parse(item.batches) : [];


    res.json({
      success: true,
      data: {
        ...item,
        batches, // Ensure batches is an array
      },
    });
  } catch (err) {
    console.error("🔥 Error fetching single stock item:", err);
    res.status(500).json({ message: "Error fetching stock item" });
  } finally {
    connection.release();
  }
});

module.exports = router;
