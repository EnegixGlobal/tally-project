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
        s.type,
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

    /* ===============================
       🔥 RUNTIME COLUMN CHECK & ADD
       =============================== */

    const ensureColumn = async (table, column, definition) => {
      const [rows] = await connection.execute(
        `
        SELECT COUNT(*) AS count
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        `,
        [table, column]
      );

      if (rows[0].count === 0) {
        await connection.execute(
          `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
        );
      }
    };

    // 🔒 REQUIRED SAFE COLUMNS (LOCAL + PROD)
    await ensureColumn("stock_items", "categoryId", "VARCHAR(50) NULL");
    await ensureColumn("stock_items", "stockGroupId", "INT(11) NULL");
    await ensureColumn(
      "stock_items",
      "openingValue",
      "DECIMAL(10,2) DEFAULT 0"
    );
    await ensureColumn("stock_items", "type", "VARCHAR(50) DEFAULT 'opening'");
    await ensureColumn(
      "stock_items",
      "createdAt",
      "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
    );

    /* ===============================
       📥 REQUEST DATA
       =============================== */

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

    const batchNames = batches
      .map((b) => (b.batchName || "").trim().toUpperCase())
      .filter(Boolean);

    const uniqueBatchNames = new Set(batchNames);

    if (batchNames.length !== uniqueBatchNames.size) {
      return res.status(400).json({
        success: false,
        message: "Duplicate batchName found in request",
      });
    }

    const sanitize = (v) => (v === "" || v === undefined ? null : v);

    /* ===============================
       📦 BATCH CALCULATION
       =============================== */

    for (const batchName of batchNames) {
      const [rows] = await connection.execute(
        `
        SELECT id FROM stock_items
        WHERE company_id=? AND owner_type=? AND owner_id=?
        AND JSON_SEARCH(
          UPPER(batches),
          'one',
          ?,
          NULL,
          '$[*].batchName'
        ) IS NOT NULL
        `,
        [company_id, owner_type, owner_id, batchName]
      );

      if (rows.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: `Batch "${batchName}" already exists`,
        });
      }
    }

    let totalOpeningValue = 0;

    const batchData = batches.map((b) => {
      const qty = Number(b.batchQuantity) || 0;
      const rate = Number(b.batchRate) || 0;
      const openingValue = qty * rate;

      totalOpeningValue += openingValue;

      return {
        batchName: sanitize(b.batchName),
        batchQuantity: qty,
        openingRate: rate,
        openingValue,
        batchExpiryDate: sanitize(b.batchExpiryDate),
        batchManufacturingDate: sanitize(b.batchManufacturingDate),
        mode: "opening",
      };
    });

    /* ===============================
       🧠 SAFE DYNAMIC INSERT
       =============================== */

    const [columnsResult] = await connection.execute(
      "SHOW COLUMNS FROM stock_items"
    );

    const columnNames = columnsResult
      .filter((c) => c.Field !== "id")
      .map((c) => c.Field);

    const values = columnNames.map((column) => {
      switch (column) {
        case "name":
          return name;
        case "stockGroupId":
          return sanitize(stockGroupId);
        case "categoryId":
          return sanitize(categoryId);
        case "unit":
          return sanitize(unit);
        case "openingBalance":
          return openingBalance ?? 0;
        case "openingValue":
          return totalOpeningValue ?? 0;
        case "hsnCode":
          return sanitize(hsnCode);
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
          return sanitize(secondaryUnit);
        case "barcode":
          return sanitize(barcode);
        case "company_id":
          return sanitize(company_id);
        case "owner_type":
          return sanitize(owner_type);
        case "owner_id":
          return sanitize(owner_id);
        case "batches":
          return JSON.stringify(batchData);
        case "type":
          return "opening";
        case "createdAt":
          return new Date();
        default:
          return null;
      }
    });

    // 🔐 FAIL-SAFE FOR FUTURE NOT-NULL COLUMNS
    columnsResult.forEach((col, i) => {
      if (
        col.Null === "NO" &&
        col.Default === null &&
        values[i] === null &&
        col.Field !== "id"
      ) {
        values[i] = col.Field === "createdAt" ? new Date() : "";
      }
    });

    const placeholders = columnNames.map(() => "?").join(", ");

    const insertQuery = `
      INSERT INTO stock_items (${columnNames.join(", ")})
      VALUES (${placeholders})
    `;

    const [result] = await connection.execute(insertQuery, values);

    const stockItemId = result.insertId;

    /* ===============================
       🏬 GODOWN ALLOCATIONS
       =============================== */

    for (const alloc of godownAllocations) {
      await connection.execute(
        `
        INSERT INTO godown_allocations
        (stockItemId, godownId, quantity, value)
        VALUES (?, ?, ?, ?)
        `,
        [
          stockItemId,
          sanitize(alloc.godownId),
          alloc.quantity ?? 0,
          alloc.value ?? 0,
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Stock item saved successfully",
      stockItemId,
      openingValue: totalOpeningValue,
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

// stock purchase item

router.post("/purchase-batch", async (req, res) => {
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

    // 1️⃣ Create table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stock_purchase (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        stockGroupId INT,
        categoryId INT,
        unit VARCHAR(50) NOT NULL,
        openingBalance DECIMAL(15,2) DEFAULT 0,
        openingValue DECIMAL(15,2) DEFAULT 0,
        hsnCode VARCHAR(50),
        gstRate DECIMAL(5,2) DEFAULT 0,
        taxType VARCHAR(50),
        standardPurchaseRate DECIMAL(15,2) DEFAULT 0,
        standardSaleRate DECIMAL(15,2) DEFAULT 0,
        enableBatchTracking TINYINT(1) DEFAULT 0,
        allowNegativeStock TINYINT(1) DEFAULT 0,
        maintainInPieces TINYINT(1) DEFAULT 0,
        secondaryUnit VARCHAR(50),
        barcode VARCHAR(100),
        company_id INT,
        owner_type VARCHAR(50),
        owner_id INT,
        batches JSON,
        type VARCHAR(50) DEFAULT 'purchase',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Helper to convert empty strings to null
    const sanitize = (value) =>
      value === "" || value === undefined ? null : value;

    // 2️⃣ Prepare batch data
    let totalOpeningValue = 0;

    const batchData = (batches || []).map((batch) => {
      const qty = Number(batch.batchQuantity) || 0;
      const rate = Number(batch.batchRate) || 0;
      const openingValue = qty * rate;
      totalOpeningValue += openingValue;

      return {
        batchName: sanitize(batch.batchName),
        batchQuantity: qty,
        openingRate: rate,
        openingValue,
        batchExpiryDate: sanitize(batch.batchExpiryDate),
        batchManufacturingDate: sanitize(batch.batchManufacturingDate),
      };
    });

    // 3️⃣ Insert into stock_purchase
    const insertQuery = `
      INSERT INTO stock_purchase (
        name, stockGroupId, categoryId, unit, openingBalance, openingValue,
        hsnCode, gstRate, taxType, standardPurchaseRate, standardSaleRate,
        enableBatchTracking, allowNegativeStock, maintainInPieces, secondaryUnit,
        barcode, company_id, owner_type, owner_id, batches
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      name,
      sanitize(stockGroupId),
      sanitize(categoryId),
      unit,
      openingBalance ?? 0,
      totalOpeningValue ?? 0,
      sanitize(hsnCode),
      gstRate ?? 0,
      taxType,
      standardPurchaseRate ?? 0,
      standardSaleRate ?? 0,
      enableBatchTracking ? 1 : 0,
      allowNegativeStock ? 1 : 0,
      maintainInPieces ? 1 : 0,
      sanitize(secondaryUnit),
      sanitize(barcode),
      sanitize(company_id),
      sanitize(owner_type),
      sanitize(owner_id),
      JSON.stringify(batchData),
    ];

    const [result] = await connection.execute(insertQuery, values);
    const stockItemId = result.insertId;

    // 4️⃣ Insert Godown Allocations
    for (const alloc of godownAllocations || []) {
      await connection.execute(
        `
        INSERT INTO godown_allocations (stockItemId, godownId, quantity, value)
        VALUES (?, ?, ?, ?)
      `,
        [
          stockItemId,
          sanitize(alloc.godownId),
          alloc.quantity ?? 0,
          alloc.value ?? 0,
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Stock purchase saved successfully",
      stockItemId,
      batchesInserted: batchData.length,
      openingValue: totalOpeningValue,
    });
  } catch (err) {
    console.error("🔥 Error saving stock purchase:", err);
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: "Error saving stock purchase",
      error: err.message,
    });
  } finally {
    connection.release();
  }
});

// GET stock purchases with access control
router.get("/purchase-batch", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { company_id, owner_id, owner_type } = req.query;

    if (!company_id || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id and owner_id are required to fetch data",
      });
    }

    let query = `
      SELECT * FROM stock_purchase
      WHERE company_id = ? AND owner_id = ?
    `;
    const params = [company_id, owner_id];

    if (owner_type) {
      query += " AND owner_type = ?";
      params.push(owner_type);
    }

    const [rows] = await connection.execute(query, params);

    // Parse batches JSON
    const formattedRows = rows.map((row) => ({
      ...row,
      batches: row.batches ? JSON.parse(row.batches) : [],
    }));

    res.json({
      success: true,
      data: formattedRows,
    });
  } catch (err) {
    console.error("🔥 Error fetching stock purchases:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching stock purchases",
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

// POST add a single batch to existing stock item
router.post("/:id/batches", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      batchName,
      batchQuantity = 0,
      batchRate = 0,
      batchExpiryDate = null,
      batchManufacturingDate = null,
      mode = "purchase",
      company_id,
      owner_type,
      owner_id,
    } = req.body;

    if (!id || !batchName) {
      return res
        .status(400)
        .json({ success: false, message: "Missing item id or batchName" });
    }

    // Fetch existing item
    const [rows] = await connection.execute(
      `SELECT id, batches, company_id, owner_type, owner_id FROM stock_items WHERE id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Stock item not found" });
    }

    const item = rows[0];

    // Optional access control: if company/owner provided, verify
    if (company_id && String(item.company_id) !== String(company_id)) {
      return res
        .status(403)
        .json({ success: false, message: "Company mismatch" });
    }

    if (owner_id && String(item.owner_id) !== String(owner_id)) {
      return res
        .status(403)
        .json({ success: false, message: "Owner mismatch" });
    }

    let batches = [];
    try {
      batches = item.batches ? JSON.parse(item.batches) : [];
      if (!Array.isArray(batches)) batches = [];
    } catch (e) {
      batches = [];
    }

    const newBatch = {
      batchName,
      batchQuantity: Number(batchQuantity) || 0,
      batchRate: Number(batchRate) || 0,
      batchExpiryDate: batchExpiryDate || null,
      mode: mode || "purchase",
      batchManufacturingDate: batchManufacturingDate || null,
    };

    

    batches.push(newBatch);

    await connection.execute(
      `UPDATE stock_items SET batches = ? WHERE id = ?`,
      [JSON.stringify(batches), id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Batch added",
      batch: newBatch,
      batches,
    });
  } catch (err) {
    console.error("🔥 Error adding batch:", err);
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: "Error adding batch",
      error: err.message,
    });
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
      message: "company_id, owner_type & owner_id are required",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 🔹 1. Get stock item (name check)
    const [items] = await connection.execute(
      `
      SELECT id, name 
      FROM stock_items
      WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?
      `,
      [id, company_id, owner_type, owner_id]
    );

    if (items.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Stock item not found or access denied",
      });
    }

    const itemName = items[0].name;

    // 🔹 2. Check sales_history & purchase_history usage
    const [[usage]] = await connection.execute(
      `
      SELECT 
        EXISTS (
          SELECT 1 FROM sale_history 
          WHERE itemName = ? AND companyId = ? AND ownerType = ? AND ownerId = ?
        ) AS saleUsed,
        EXISTS (
          SELECT 1 FROM purchase_history 
          WHERE itemName = ? AND companyId = ? AND ownerType = ? AND ownerId = ?
        ) AS purchaseUsed
      `,
      [
        itemName,
        company_id,
        owner_type,
        owner_id,
        itemName,
        company_id,
        owner_type,
        owner_id,
      ]
    );

    if (usage.saleUsed || usage.purchaseUsed) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message:
          "This stock item is used in Sales or Purchase vouchers, cannot delete",
      });
    }

    // 🔹 3. Delete dependent records
    await connection.execute(
      "DELETE FROM godown_allocations WHERE stockItemId = ?",
      [id]
    );

    // 🔹 4. Delete stock item
    await connection.execute("DELETE FROM stock_items WHERE id = ?", [id]);

    await connection.commit();

    return res.json({
      success: true,
      message: "Stock item deleted successfully",
    });
  } catch (err) {
    await connection.rollback();
    console.error("🔥 Error deleting stock item:", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting stock item",
    });
  } finally {
    connection.release();
  }
});

router.delete("/:itemId/delete-by-hsn", async (req, res) => {
  try {
    const { itemId } = req.params;
    const { hsnCode } = req.body;
    const { company_id, owner_type, owner_id } = req.query;

    if (!itemId || !hsnCode) {
      return res.status(400).json({
        success: false,
        message: "itemId and hsnCode required",
      });
    }

    const [result] = await db.query(
      `
      DELETE FROM stock_items
      WHERE id = ?
        AND hsnCode = ?
        AND company_id = ?
        AND owner_type = ?
        AND owner_id = ?
      `,
      [itemId, hsnCode, company_id, owner_type, owner_id]
    );

    // 🔑 IMPORTANT PART
    if (result.affectedRows === 0) {
      return res.json({
        success: true,
        message: "Already deleted",
      });
    }

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
});

//put item
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    /* ===============================
       🔥 RUNTIME COLUMN CHECK & ADD
       =============================== */

    const ensureColumn = async (table, column, definition) => {
      const [rows] = await connection.execute(
        `
        SELECT COUNT(*) AS count
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        `,
        [table, column]
      );

      if (rows[0].count === 0) {
        await connection.execute(
          `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
        );
      }
    };

    // Ensure required columns
    await ensureColumn("stock_items", "categoryId", "VARCHAR(50) NULL");
    await ensureColumn("stock_items", "stockGroupId", "INT(11) NULL");
    await ensureColumn(
      "stock_items",
      "openingValue",
      "DECIMAL(10,2) DEFAULT 0"
    );

    /* ===============================
       📥 REQUEST DATA
       =============================== */

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
      barcode,
      company_id,
      owner_type,
      owner_id,
    } = req.body;

    if (!name || !unit || !taxType) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const sanitize = (v) => (v === "" || v === undefined ? null : v);

    /* ===============================
       📦 BATCH CALCULATION
       =============================== */

    let totalOpeningValue = 0;

    const batchData = batches.map((b) => {
      const qty = Number(b.batchQuantity) || 0;
      const rate = Number(b.batchRate) || 0;
      const openingValue = qty * rate;

      totalOpeningValue += openingValue;

      return {
        batchName: sanitize(b.batchName),
        batchQuantity: qty,
        openingRate: rate,
        openingValue,
        batchExpiryDate: sanitize(b.batchExpiryDate),
        batchManufacturingDate: sanitize(b.batchManufacturingDate),
        mode: "opening",
      };
    });

    /* ===============================
       🧠 UPDATE QUERY
       =============================== */

    const updateQuery = `
      UPDATE stock_items SET 
        name = ?,
        stockGroupId = ?,
        categoryId = ?,
        unit = ?,
        openingBalance = ?,
        openingValue = ?,
        hsnCode = ?,
        gstRate = ?,
        taxType = ?,
        standardPurchaseRate = ?,
        standardSaleRate = ?,
        enableBatchTracking = ?,
        allowNegativeStock = ?,
        maintainInPieces = ?,
        secondaryUnit = ?,
        batches = ?,
        barcode = ?,
        company_id = ?,
        owner_type = ?,
        owner_id = ?
      WHERE id = ?
    `;

    const values = [
      sanitize(name),
      sanitize(stockGroupId),
      sanitize(categoryId), // ✅ FIXED
      sanitize(unit),
      openingBalance ?? 0,
      totalOpeningValue ?? 0,
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
      openingValue: totalOpeningValue,
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
  const { company_id, owner_type, owner_id, mode } = req.query;

  const connection = await db.getConnection();
  try {
    let query = `
      SELECT 
        s.id,
        s.name,
        s.stockGroupId,
        s.categoryId,
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
      return res.status(404).json({
        success: false,
        message: "No stock item found",
      });
    }

    const item = rows[0];

    // 🔥 batches parse
    let batches = item.batches ? JSON.parse(item.batches) : [];

    // 🔥 MODE FILTER (opening / purchase)
    if (mode) {
      batches = batches.filter(
        (b) => b.mode && b.mode.toLowerCase() === mode.toLowerCase()
      );
    }

    res.json({
      success: true,
      data: {
        ...item,
        batches,
      },
    });
  } catch (err) {
    console.error("🔥 Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    connection.release();
  }
});

//  UPDATE ONLY BATCHES for a Stock Item
router.patch("/:id/batches", async (req, res) => {
  const { id } = req.params;
  const { company_id, owner_type, owner_id } = req.query;
  const { batchName, quantity, rate } = req.body;

  if (quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: "quantity is required",
    });
  }

  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT batches FROM stock_items
       WHERE id=? AND company_id=? AND owner_type=? AND owner_id=?`,
      [id, company_id, owner_type, owner_id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    let batches = JSON.parse(rows[0].batches || "[]");

    const index = batches.findIndex(
      (b) => String(b.batchName ?? "") === String(batchName ?? "")
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    // =========================
    // ✅ PURE REPLACE LOGIC
    // =========================
    const newQty = Number(quantity);

    if (newQty < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    batches[index].batchQuantity = newQty;

    if (rate !== undefined) {
      batches[index].batchRate = Number(rate);
    }

    await connection.execute(`UPDATE stock_items SET batches=? WHERE id=?`, [
      JSON.stringify(batches),
      id,
    ]);

    res.json({
      success: true,
      message: "Batch updated successfully",
      updatedBatch: batches[index],
    });
  } catch (err) {
    console.error("🔥 Batch Update Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update batch",
    });
  } finally {
    connection.release();
  }
});

//delete only batch
router.delete("/:id/batch", async (req, res) => {
  const { id } = req.params;
  const { company_id, owner_type, owner_id } = req.query;
  const { batchName } = req.body;

  if (!batchName) {
    return res.status(400).json({
      success: false,
      message: "batchName is required",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `
      SELECT batches FROM stock_items
      WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?
      `,
      [id, company_id, owner_type, owner_id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    const batches = JSON.parse(rows[0].batches || "[]");

    const updatedBatches = batches.filter(
      (b) => String(b.batchName) !== String(batchName)
    );

    if (updatedBatches.length === batches.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    await connection.execute(
      "UPDATE stock_items SET batches = ? WHERE id = ?",
      [JSON.stringify(updatedBatches), id]
    );

    await connection.commit();

    res.json({ success: true, batches: updatedBatches });
  } catch (err) {
    await connection.rollback();
    console.error("🔥 Delete batch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    connection.release();
  }
});

module.exports = router;
