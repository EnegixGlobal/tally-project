const express = require("express");
const router = express.Router();
const db = require("../db");

/* ======================================================
   🔥 AUTO MIGRATION (SERVER START PE)
====================================================== */
const ensureTableAndColumns = async () => {
  try {
    // 1️⃣ Table exist check
    await db.query(`
      CREATE TABLE IF NOT EXISTS set_profit (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_type VARCHAR(50) NOT NULL,
        owner_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2️⃣ Existing columns fetch
    const [columns] = await db.query(`
      SHOW COLUMNS FROM set_profit;
    `);

    const columnNames = columns.map((c) => c.Field);

    // 3️⃣ Required columns list (making them nullable to avoid 'no default value' errors)
    const requiredColumns = [
      { name: "wholesale_method", type: "VARCHAR(50) NULL" },
      { name: "wholesale_value", type: "DECIMAL(10,2) NULL" },
      { name: "retailer_method", type: "VARCHAR(50) NULL" },
      { name: "retailer_value", type: "DECIMAL(10,2) NULL" },
      { name: "customer_type", type: "VARCHAR(50) NULL" },
      { name: "method", type: "VARCHAR(50) NULL" },
      { name: "value", type: "DECIMAL(10,2) NULL" },
    ];

    // 4️⃣ Add missing columns or update existing to be nullable
    for (const col of requiredColumns) {
      if (!columnNames.includes(col.name)) {
        await db.query(`
          ALTER TABLE set_profit
          ADD COLUMN ${col.name} ${col.type};
        `);
      } else {
        // Force existing columns to be nullable if they weren't before
        await db.query(`
          ALTER TABLE set_profit
          MODIFY COLUMN ${col.name} ${col.type};
        `);
      }
    }

    // 5️⃣ Ensure unique index on owner_type + owner_id so we can upsert
    try {
      const [existingIndex] = await db.query(
        "SHOW INDEX FROM set_profit WHERE Key_name = 'uq_owner'"
      );
      if (!existingIndex || existingIndex.length === 0) {
        await db.query(
          `ALTER TABLE set_profit ADD UNIQUE KEY uq_owner (owner_type, owner_id)`
        );
  
      }
    } catch (err) {
      // If index exists or any error, just log and continue
      console.log("ℹ️ uq_owner index check/create skipped or failed:", err.message || err);
    }

  } catch (err) {
    console.error("❌ Migration error:", err);
  }
};

// 🔥 RUN MIGRATION ON SERVER START
ensureTableAndColumns();

/* ======================================================
   🔥 SAVE / UPDATE PROFIT (WHOLESALE + RETAILER)
====================================================== */
router.put("/", async (req, res) => {
  try {
    let {
      wholesale_method,
      wholesale_value,
      retailer_method,
      retailer_value,
      ownerType,
      ownerId,
    } = req.body;

    if (!ownerType || !ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner information missing",
      });
    }

    // Normalize values: empty string -> null for methods, numeric parse for values
    wholesale_method = wholesale_method || null;
    retailer_method = retailer_method || null;

    const parseNumeric = (v) => {
      if (v === null || v === undefined || v === "") return 0;
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    wholesale_value = parseNumeric(wholesale_value);
    retailer_value = parseNumeric(retailer_value);

    // Use INSERT ... ON DUPLICATE KEY UPDATE to upsert both wholesale & retailer values atomically
    await db.query(
      `INSERT INTO set_profit (wholesale_method, wholesale_value, retailer_method, retailer_value, owner_type, owner_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         wholesale_method = VALUES(wholesale_method),
         wholesale_value = VALUES(wholesale_value),
         retailer_method = VALUES(retailer_method),
         retailer_value = VALUES(retailer_value)`,
      [
        wholesale_method,
        wholesale_value,
        retailer_method,
        retailer_value,
        ownerType,
        ownerId,
      ]
    );

    return res.json({ success: true, message: "Profit configuration saved successfully" });
  } catch (error) {
    console.error("🔥 Save error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================================
   🔍 GET PROFIT CONFIG (VOUCHER KE LIYE)
====================================================== */
router.get("/:ownerId/:ownerType", async (req, res) => {
  try {
    const { ownerId, ownerType } = req.params;

    const [rows] = await db.query(
      `SELECT
        wholesale_method,
        wholesale_value,
        retailer_method,
        retailer_value
       FROM set_profit
       WHERE owner_id = ? AND owner_type = ?
       LIMIT 1`,
      [ownerId, ownerType]
    );

    res.json({
      success: true,
      data: rows[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
