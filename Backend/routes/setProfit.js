const express = require("express");
const router = express.Router();
const db = require("../db");

// Auto Create Table If Not Exists
const createTableQuery = `
CREATE TABLE IF NOT EXISTS set_profit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_type VARCHAR(50) NOT NULL,
  method VARCHAR(50) NOT NULL,
  value DECIMAL(10) NOT NULL,
  owner_type VARCHAR(50) NOT NULL,
  owner_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

(async () => {
  try {
    await db.query(createTableQuery);
  } catch (err) {
    console.error("❌ Table creation error:", err);
  }
})();

// 🔥 Update OR Insert Set Profit
router.put("/", async (req, res) => {
  try {
    const { customerType, method, value, ownerType, ownerId } = req.body;

    if (
      !customerType ||
      !method ||
      value === "" ||
      value === undefined ||
      value === null ||
      !ownerType ||
      !ownerId
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    // Check existing record
    const [existing] = await db.query(
      `SELECT id FROM set_profit WHERE owner_id = ? AND owner_type = ?`,
      [ownerId, ownerType]
    );

    if (existing.length > 0) {
      // 🔄 Update
      const recordId = existing[0].id;

      await db.query(
        `UPDATE set_profit 
         SET customer_type = ?, method = ?, value = ? 
         WHERE id = ?`,
        [customerType, method, value, recordId]
      );

      return res.json({
        success: true,
        message: "Profit updated successfully!",
        updated: true,
      });
    } else {
      // ➕ Insert new record
      await db.query(
        `INSERT INTO set_profit 
        (customer_type, method, value, owner_type, owner_id) 
        VALUES (?, ?, ?, ?, ?)`,
        [customerType, method, value, ownerType, ownerId]
      );

      return res.status(201).json({
        success: true,
        message: "Profit saved successfully!",
        inserted: true,
      });
    }
  } catch (error) {
    console.error("🔥 Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again later",
    });
  }
});

// 🔍 Get Profit Settings by Owner
router.get("/:ownerId/:ownerType", async (req, res) => {
  try {
    const { ownerId, ownerType } = req.params;

    const [rows] = await db.query(
      `SELECT customer_type, method, value 
       FROM set_profit 
       WHERE owner_id = ? AND owner_type = ?
       LIMIT 1`,
      [ownerId, ownerType]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        message: "No configuration found",
        data: null,
      });
    }

    return res.json({
      success: true,
      message: "Profit configuration fetched successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("🔥 GET API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching data",
    });
  }
});

module.exports = router;
