const express = require("express");
const router = express.Router();
const db = require("../db");

// Sales Types CRUD
// Table: sales_types (id, sales_type, type, prefix, suffix, current_no, created_at, updated_at)

// Get all sales types (filtered by tenant)
router.get("/", async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  try {
    let query = "SELECT * FROM sales_types";
    let params = [];

    // If tenant info provided, filter by it
    if (company_id && owner_type && owner_id) {
      query += " WHERE company_id = ? AND owner_type = ? AND owner_id = ?";
      params = [company_id, owner_type, owner_id];
    }

    query += " ORDER BY id DESC";

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching sales types:", err);
    res.status(500).json({ success: false, message: "Error fetching sales types" });
  }
});

// Get single sales type
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM sales_types WHERE id = ?", [
      id,
    ]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Sales type not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Error fetching sales type:", err);
    res.status(500).json({ success: false, message: "Error fetching sales type" });
  }
});

// Create sales type
router.post("/", async (req, res) => {
  const { sales_type, type, prefix, suffix, current_no, company_id, owner_type, owner_id } = req.body || {};

  if (!sales_type || !type) {
    return res.status(400).json({
      success: false,
      message: "sales_type and type are required",
    });
  }

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({
      success: false,
      message: "company_id, owner_type, and owner_id are required",
    });
  }

  const currentNo = Number.isFinite(Number(current_no)) ? Number(current_no) : 1;

  try {
    // ================= CHECK & ADD TENANT COLUMNS IF MISSING =================
    try {
      const [companyIdCheck] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sales_types'
           AND COLUMN_NAME = 'company_id'`
      );

      if (companyIdCheck.length === 0) {
        await db.query(
          `ALTER TABLE sales_types ADD COLUMN company_id VARCHAR(100) NULL`
        );
        console.log("✅ Added company_id column to sales_types");
      }

      const [ownerTypeCheck] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sales_types'
           AND COLUMN_NAME = 'owner_type'`
      );

      if (ownerTypeCheck.length === 0) {
        await db.query(
          `ALTER TABLE sales_types ADD COLUMN owner_type VARCHAR(50) NULL`
        );
        console.log("✅ Added owner_type column to sales_types");
      }

      const [ownerIdCheck] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sales_types'
           AND COLUMN_NAME = 'owner_id'`
      );

      if (ownerIdCheck.length === 0) {
        await db.query(
          `ALTER TABLE sales_types ADD COLUMN owner_id VARCHAR(100) NULL`
        );
        console.log("✅ Added owner_id column to sales_types");
      }
    } catch (colErr) {
      console.error("Column check/add error (non-fatal):", colErr);
    }

    const [result] = await db.query(
      "INSERT INTO sales_types (sales_type, type, prefix, suffix, current_no, company_id, owner_type, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [sales_type, type, prefix || "", suffix || "", currentNo, company_id, owner_type, owner_id]
    );
    res.json({ success: true, message: "Sales type created", id: result.insertId });
  } catch (err) {
    console.error("Error creating sales type:", err);
    res.status(500).json({ success: false, message: "Error creating sales type" });
  }
});

// Update sales type
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { sales_type, type, prefix, suffix, current_no, company_id, owner_type, owner_id } = req.body || {};

  if (!sales_type || !type) {
    return res.status(400).json({
      success: false,
      message: "sales_type and type are required",
    });
  }

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({
      success: false,
      message: "company_id, owner_type, and owner_id are required",
    });
  }

  const currentNo = Number.isFinite(Number(current_no)) ? Number(current_no) : 1;

  try {
    // ================= CHECK & ADD TENANT COLUMNS IF MISSING =================
    try {
      const [companyIdCheck] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sales_types'
           AND COLUMN_NAME = 'company_id'`
      );

      if (companyIdCheck.length === 0) {
        await db.query(
          `ALTER TABLE sales_types ADD COLUMN company_id VARCHAR(100) NULL`
        );
      }

      const [ownerTypeCheck] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sales_types'
           AND COLUMN_NAME = 'owner_type'`
      );

      if (ownerTypeCheck.length === 0) {
        await db.query(
          `ALTER TABLE sales_types ADD COLUMN owner_type VARCHAR(50) NULL`
        );
      }

      const [ownerIdCheck] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sales_types'
           AND COLUMN_NAME = 'owner_id'`
      );

      if (ownerIdCheck.length === 0) {
        await db.query(
          `ALTER TABLE sales_types ADD COLUMN owner_id VARCHAR(100) NULL`
        );
      }
    } catch (colErr) {
      console.error("Column check/add error (non-fatal):", colErr);
    }

    const [result] = await db.query(
      "UPDATE sales_types SET sales_type = ?, type = ?, prefix = ?, suffix = ?, current_no = ?, company_id = ?, owner_type = ?, owner_id = ? WHERE id = ?",
      [sales_type, type, prefix || "", suffix || "", currentNo, company_id, owner_type, owner_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Sales type not found" });
    }

    res.json({ success: true, message: "Sales type updated" });
  } catch (err) {
    console.error("Error updating sales type:", err);
    res.status(500).json({ success: false, message: "Error updating sales type" });
  }
});

// Delete sales type
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  // Prevent deletion of default Sales type (id = 1)
  if (id === "1" || Number(id) === 1) {
    return res.status(403).json({ 
      success: false, 
      message: "Cannot delete the default Sales type. This type is required for the system." 
    });
  }
  
  try {
    const [result] = await db.query("DELETE FROM sales_types WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Sales type not found" });
    }
    res.json({ success: true, message: "Sales type deleted" });
  } catch (err) {
    console.error("Error deleting sales type:", err);
    res.status(500).json({ success: false, message: "Error deleting sales type" });
  }
});

module.exports = router;


