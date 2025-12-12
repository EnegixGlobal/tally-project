const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all stock items (scoped)
router.get("/", async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  const connection = await db.getConnection();
  try {
    let query = `
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
        s.taxType,
        s.barcode,
        s.batches,
        s.company_id,
        s.owner_type,
        s.owner_id
      FROM stock_items s
      LEFT JOIN stock_groups sg ON s.stockGroupId = sg.id
      LEFT JOIN stock_units u ON s.unit = u.id
      WHERE 1 = 1
    `;

    const params = [];

    if (company_id) {
      query += " AND s.company_id = ?";
      params.push(company_id);
    }

    if (owner_type) {
      query += " AND s.owner_type = ?";
      params.push(owner_type);
    }

    if (owner_id) {
      query += " AND s.owner_id = ?";
      params.push(owner_id);
    }

    query += " ORDER BY s.id DESC";

    const [rows] = await connection.execute(query, params);


    const formattedRows = rows.map((item) => ({
      ...item,
      batches: item.batches ? JSON.parse(item.batches) : [],
    }));

    // console.log(formattedRows);

    return res.json({
      success: true,
      data: formattedRows,
    });
  } catch (err) {
    console.error("🔥 Error fetching stock items:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching stock items",
    });
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

// router.post("/", async (req, res) => {
//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     const {
//       name,
//       stockGroupId,
//       categoryId,
//       unit,
//       openingBalance,
//       hsnCode,
//       gstRate,
//       taxType,
//       standardPurchaseRate,
//       standardSaleRate,
//       enableBatchTracking,
//       allowNegativeStock,
//       maintainInPieces,
//       secondaryUnit,
//       batches = [],
//       godownAllocations = [],
//       barcode,
//       company_id,
//       owner_type,
//       owner_id,
//     } = req.body;


//     if (!name || !unit || !taxType) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: name, unit, or taxType",
//       });
//     }

//     // ✔ Ensure openingValue column exists dynamically
//     const [colCheck] = await connection.execute(`
//       SELECT COUNT(*) AS count 
//       FROM information_schema.COLUMNS 
//       WHERE TABLE_NAME = 'stock_items' 
//       AND COLUMN_NAME = 'openingValue'
//     `);

//     if (colCheck[0].count === 0) {
//       await connection.execute(`
//         ALTER TABLE stock_items 
//         ADD COLUMN openingValue DECIMAL(15,2) DEFAULT 0
//       `);
//       console.log("📌 Column openingValue created successfully!");
//     }


//     // ✔ Correct Batch Mapping (OpeningRate = Rate)
//     let totalOpeningValue = 0;

//     const batchData = enableBatchTracking
//       ? batches.map((batch) => {
//           const qty = Number(batch.batchQuantity) || 0;
//           const rate = Number(batch.batchRate) || 0;
//           const openingRate = rate; // Correct mapping
//           const openingValue = qty * rate; // Correct calculation

//           totalOpeningValue += openingValue;

//           return {
//             batchName: batch.batchName || "",
//             batchQuantity: qty,
//             openingRate,
//             openingValue,
//             batchExpiryDate: batch.batchExpiryDate || null,
//             batchManufacturingDate: batch.batchManufacturingDate || null,
//           };
//         })
//       : [];


//     const finalOpeningValue = totalOpeningValue;


//     // Fetch stock_items table columns dynamically
//     const [columnsResult] = await connection.execute(`
//       SHOW COLUMNS FROM stock_items
//     `);

//     const columnNames = columnsResult
//       .filter((col) => col.Field !== "id")
//       .map((col) => col.Field);

//     const values = columnNames.map((column) => {
//       switch (column) {
//         case "name":
//           return name;
//         case "stockGroupId":
//           return stockGroupId ?? null;
//         case "categoryId":
//           return categoryId ?? null;
//         case "unit":
//           return unit ?? null;
//         case "openingBalance":
//           return openingBalance ?? 0;
//         case "openingValue":
//           return finalOpeningValue ?? 0;
//         case "hsnCode":
//           return hsnCode ?? null;
//         case "gstRate":
//           return gstRate ?? 0;
//         case "taxType":
//           return taxType;
//         case "standardPurchaseRate":
//           return standardPurchaseRate ?? 0;
//         case "standardSaleRate":
//           return standardSaleRate ?? 0;
//         case "enableBatchTracking":
//           return enableBatchTracking ? 1 : 0;
//         case "allowNegativeStock":
//           return allowNegativeStock ? 1 : 0;
//         case "maintainInPieces":
//           return maintainInPieces ? 1 : 0;
//         case "secondaryUnit":
//           return secondaryUnit ?? null;
//         case "barcode":
//           return barcode;
//         case "company_id":
//           return company_id ?? null;
//         case "owner_type":
//           return owner_type ?? null;
//         case "owner_id":
//           return owner_id ?? null;
//         case "batches":
//           return JSON.stringify(batchData);
//         default:
//           return null;
//       }
//     });


//     const placeholders = columnNames.map(() => "?").join(", ");
//     const insertQuery = `
//       INSERT INTO stock_items (${columnNames.join(", ")})
//       VALUES (${placeholders})
//     `;

//     const [result] = await connection.execute(insertQuery, values);
//     const stockItemId = result.insertId;


//     // Insert Godown Allocations
//     for (const alloc of godownAllocations) {
//       await connection.execute(
//         `
//         INSERT INTO godown_allocations (stockItemId, godownId, quantity, value)
//         VALUES (?, ?, ?, ?)
//       `,
//         [stockItemId, alloc.godownId, alloc.quantity, alloc.value]
//       );
//     }

//     await connection.commit();

//     res.json({
//       success: true,
//       message: "Stock item saved successfully",
//       stockItemId,
//       batchesInserted: batchData.length,
//       openingValue: finalOpeningValue,
//     });
//   } catch (err) {
//     console.error("🔥 Error saving stock item:", err);
//     await connection.rollback();
//     res.status(500).json({
//       success: false,
//       message: "Error saving stock item",
//       error: err.message,
//     });
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
      categoryId,
      unit,
      openingBalance,
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
      company_id,
      owner_type,
      owner_id,
    } = req.body;


    if (!name || !unit || !taxType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, unit, or taxType",
      });
    }

    // Ensure openingValue column exists dynamically
    const [colCheck] = await connection.execute(`
      SELECT COUNT(*) AS count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_NAME = 'stock_items' 
      AND COLUMN_NAME = 'openingValue'
    `);

    if (colCheck[0].count === 0) {
      await connection.execute(`
        ALTER TABLE stock_items 
        ADD COLUMN openingValue DECIMAL(15,2) DEFAULT 0
      `);
    }

    // Helper to convert empty strings to null
    const sanitize = (value) => {
      if (value === "" || value === undefined) return null;
      return value;
    };

    // Batch handling - always map batches regardless of enableBatchTracking
    let totalOpeningValue = 0;

    const batchData = (batches || []).map(batch => {
      const qty = Number(batch.batchQuantity) || 0;
      const rate = Number(batch.batchRate) || 0;
      const openingRate = rate;
      const openingValue = qty * rate;

      totalOpeningValue += openingValue;

      return {
        batchName: sanitize(batch.batchName),
        batchQuantity: qty,
        openingRate,
        openingValue,
        batchExpiryDate: sanitize(batch.batchExpiryDate),
        batchManufacturingDate: sanitize(batch.batchManufacturingDate),
      };
    });

    const finalOpeningValue = totalOpeningValue;

    // Fetch stock_items table columns dynamically
    const [columnsResult] = await connection.execute(`SHOW COLUMNS FROM stock_items`);

    const columnNames = columnsResult
      .filter(col => col.Field !== "id")
      .map(col => col.Field);

    const values = columnNames.map(column => {
      switch (column) {
        case "name": return name;
        case "stockGroupId": return sanitize(stockGroupId);
        case "categoryId": return sanitize(categoryId);
        case "unit": return sanitize(unit);
        case "openingBalance": return openingBalance ?? 0;
        case "openingValue": return finalOpeningValue ?? 0;
        case "hsnCode": return sanitize(hsnCode);
        case "gstRate": return gstRate ?? 0;
        case "taxType": return taxType;
        case "standardPurchaseRate": return standardPurchaseRate ?? 0;
        case "standardSaleRate": return standardSaleRate ?? 0;
        case "enableBatchTracking": return enableBatchTracking ? 1 : 0;
        case "allowNegativeStock": return allowNegativeStock ? 1 : 0;
        case "maintainInPieces": return maintainInPieces ? 1 : 0;
        case "secondaryUnit": return sanitize(secondaryUnit);
        case "barcode": return sanitize(barcode);
        case "company_id": return sanitize(company_id);
        case "owner_type": return sanitize(owner_type);
        case "owner_id": return sanitize(owner_id);
        case "batches": return JSON.stringify(batchData); // always save batch info
        case "createdAt": return "CURRENT_TIMESTAMP";
        default: return null;
      }
    });

    const placeholders = columnNames.map(() => "?").join(", ");
    const insertQuery = `
      INSERT INTO stock_items (${columnNames.join(", ")})
      VALUES (${placeholders})
    `;

    const [result] = await connection.execute(insertQuery, values);
    const stockItemId = result.insertId;

    // Insert Godown Allocations safely
    for (const alloc of godownAllocations || []) {
      await connection.execute(`
        INSERT INTO godown_allocations (stockItemId, godownId, quantity, value)
        VALUES (?, ?, ?, ?)
      `, [
        stockItemId,
        sanitize(alloc.godownId),
        alloc.quantity ?? 0,
        alloc.value ?? 0
      ]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Stock item saved successfully",
      stockItemId,
      batchesInserted: batchData.length,
      openingValue: finalOpeningValue,
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
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({
      success: false,
      message: "company_id, owner_type & owner_id are required"
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Check if item belongs to same owner + company
    const [check] = await connection.execute(
      `
      SELECT id FROM stock_items 
      WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?
      `,
      [id, company_id, owner_type, owner_id]
    );

    if (check.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Stock item not found or access denied"
      });
    }

    await connection.execute(
      "DELETE FROM godown_allocations WHERE stockItemId = ?",
      [id]
    );

    await connection.execute("DELETE FROM stock_items WHERE id = ?", [id]);

    await connection.commit();

    return res.json({
      success: true,
      message: "Stock item deleted successfully"
    });

  } catch (err) {
    await connection.rollback();
    console.error("🔥 Error deleting stock item:", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting stock item"
    });
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
      company_id,
      owner_type,
      owner_id,
    } = req.body;

    if (!name || !unit || !taxType) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Helper to sanitize empty strings
    const sanitize = (value) => {
      if (value === "" || value === undefined) return null;
      return value;
    };

    // Map batches and calculate total opening value
    let totalOpeningValue = 0;

    const batchData = (batches || []).map(batch => {
      const qty = Number(batch.batchQuantity) || 0;
      const rate = Number(batch.batchRate) || 0;
      const openingRate = rate;
      const openingValue = qty * rate;

      totalOpeningValue += openingValue;

      return {
        batchName: sanitize(batch.batchName),
        batchQuantity: qty,
        openingRate,
        openingValue,
        batchExpiryDate: sanitize(batch.batchExpiryDate),
        batchManufacturingDate: sanitize(batch.batchManufacturingDate),
      };
    });

    const finalOpeningValue = totalOpeningValue;

    const updateQuery = `
      UPDATE stock_items SET 
        name=?, stockGroupId=?, unit=?, openingBalance=?, openingValue=?,
        hsnCode=?, gstRate=?, taxType=?, standardPurchaseRate=?, standardSaleRate=?,
        enableBatchTracking=?, allowNegativeStock=?, maintainInPieces=?, secondaryUnit=?,
        batches=?, barcode=?, company_id=?, owner_type=?, owner_id=? 
      WHERE id=?
    `;

    const values = [
      sanitize(name),
      sanitize(stockGroupId),
      sanitize(unit),
      openingBalance ?? 0,
      finalOpeningValue ?? 0,
      sanitize(hsnCode),
      gstRate ?? 0,
      taxType ?? "Taxable",
      standardPurchaseRate ?? 0,
      standardSaleRate ?? 0,
      enableBatchTracking ? 1 : 0,
      allowNegativeStock ? 1 : 0,
      maintainInPieces ? 1 : 0,
      sanitize(secondaryUnit),
      JSON.stringify(batchData),
      sanitize(barcode),
      sanitize(company_id),
      sanitize(owner_type),
      sanitize(owner_id),
      id,
    ];

    await connection.execute(updateQuery, values);
    await connection.commit();

    return res.json({
      success: true,
      message: "Stock item updated successfully!",
      id,
      batches: batchData,
      openingValue: finalOpeningValue,
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
  const { company_id, owner_type, owner_id } = req.query;


  if (!id) {
    return res.status(400).json({ success: false, message: "Stock item ID is required" });
  }

  const connection = await db.getConnection();
  try {
    let query = `
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
        s.taxType,
        s.barcode,
        s.batches,
        s.company_id,
        s.owner_type,
        s.owner_id
      FROM stock_items s
      LEFT JOIN stock_groups sg ON s.stockGroupId = sg.id
      LEFT JOIN stock_units u ON s.unit = u.id
      WHERE s.id = ?
    `;

    const params = [id];

    if (company_id) {
      query += " AND s.company_id = ?";
      params.push(company_id);
    }
    if (owner_type) {
      query += " AND s.owner_type = ?";
      params.push(owner_type);
    }
    if (owner_id) {
      query += " AND s.owner_id = ?";
      params.push(owner_id);
    }

    const [rows] = await connection.execute(query, params);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "No stock item found for this tenant" });
    }

    const item = rows[0];

    res.json({
      success: true,
      data: {
        ...item,
        batches: item.batches ? JSON.parse(item.batches) : []
      }
    });

  } catch (err) {
    console.error("🔥 Error fetching single stock item:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching stock item"
    });
  } finally {
    connection.release();
  }
});


//  UPDATE ONLY BATCHES for a Stock Item
router.patch("/:id/batches", async (req, res) => {
  const { id } = req.params;
  const { company_id, owner_type, owner_id } = req.query;
  const { batchName, quantity, rate } = req.body;

  if (!batchName || quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: "batchName & quantity required",
    });
  }

  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT batches FROM stock_items WHERE id=? AND company_id=? AND owner_type=? AND owner_id=?`,
      [id, company_id, owner_type, owner_id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    let batches = JSON.parse(rows[0].batches || "[]");
    const diffQty = Number(quantity); // +ve Purchase, -ve Sales

    // 🔍 Find batch
    const index = batches.findIndex(b => b.batchName === batchName);

    if (index >= 0) {
      let currentQty = Number(batches[index].batchQuantity || 0);
      let updatedQty = currentQty + diffQty;

      // ❌ Prevent Negative Stock
      if (updatedQty < 0) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock in batch! Available: ${currentQty}`,
        });
      }

      // 🔥 Update quantity
      batches[index].batchQuantity = updatedQty;

      // 🔥 Update rate only if positive showing purchase
      if (Number(diffQty) > 0 && Number(rate) > 0) {
        batches[index].batchRate = Number(rate);
      }

    } else {
      // 🆕 New batch creation only if purchase / positive qty
      if (diffQty < 0) {
        return res.status(404).json({
          success: false,
          message: "Batch not found for Sales",
        });
      }

      batches.push({
        batchName,
        batchQuantity: diffQty,
        batchRate: Number(rate) || 0,
        batchExpiryDate: null,
        batchManufacturingDate: null,
      });
    }

    await connection.execute(
      `UPDATE stock_items SET batches=? WHERE id=?`,
      [JSON.stringify(batches), id]
    );

    return res.json({
      success: true,
      message: "Batch updated successfully",
      updatedBatches: batches,
    });

  } catch (err) {
    console.error("🔥 Batch Update Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update batch stock",
      error: err.message,
    });
  } finally {
    connection.release();
  }
});








module.exports = router;
