const express = require("express");
const router = express.Router();
const db = require("../db");

// Sales Types CRUD


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
    res
      .status(500)
      .json({ success: false, message: "Error fetching sales types" });
  }
});

// Get single sales type
// Get single sales type (STRICT TENANT SAFE)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { company_id, owner_type, owner_id } = req.query;
  console.log("id", id);

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({
      success: false,
      message: "company_id, owner_type, and owner_id are required",
    });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT *
      FROM sales_types
      WHERE id = ?
        AND company_id = ?
        AND owner_type = ?
        AND owner_id = ?
      LIMIT 1
      `,
      [id, company_id, owner_type, owner_id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Sales type not found",
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Error fetching sales type:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching sales type",
    });
  }
});

// Create sales type
router.post("/", async (req, res) => {
  const {
    sales_type,
    prefix,
    suffix,
    current_no,
    company_id,
    owner_type,
    owner_id,
  } = req.body || {};

  // 🔒 type backend-controlled
  const type = "Sales";

  if (!sales_type) {
    return res.status(400).json({
      success: false,
      message: "sales_type is required",
    });
  }

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({
      success: false,
      message: "company_id, owner_type, and owner_id are required",
    });
  }

  const currentNo = Number.isFinite(Number(current_no))
    ? Number(current_no)
    : 1;

  try {
    /* =========================================================
       🔧 SELF-HEALING DB CHECK (SAFE FOR SERVER)
       ========================================================= */

    // 🔹 1. Check id column (PRIMARY KEY + AUTO_INCREMENT)
    const [idInfo] = await db.query(`
      SELECT COLUMN_KEY, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'sales_types'
        AND COLUMN_NAME = 'id'
    `);

    if (idInfo.length) {
      const isPrimary = idInfo[0].COLUMN_KEY === "PRI";
      const isAuto = idInfo[0].EXTRA.includes("auto_increment");

      // Add PRIMARY KEY if missing
      if (!isPrimary) {
        await db.query(`
          ALTER TABLE sales_types
          ADD PRIMARY KEY (id)
        `);
        console.log("✅ PRIMARY KEY added on sales_types.id");
      }

      // Add AUTO_INCREMENT if missing
      if (!isAuto) {
        await db.query(`
          ALTER TABLE sales_types
          MODIFY id INT(11) NOT NULL AUTO_INCREMENT
        `);
        console.log("✅ AUTO_INCREMENT enabled on sales_types.id");
      }
    }

    // 🔹 2. Ensure tenant columns exist (run once only)
    const ensureColumn = async (column, sql) => {
      const [rows] = await db.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'sales_types'
          AND COLUMN_NAME = ?
      `,
        [column]
      );

      if (rows.length === 0) {
        await db.query(sql);
        console.log(`✅ Column added: ${column}`);
      }
    };

    await ensureColumn(
      "company_id",
      "ALTER TABLE sales_types ADD COLUMN company_id VARCHAR(100) NULL"
    );
    await ensureColumn(
      "owner_type",
      "ALTER TABLE sales_types ADD COLUMN owner_type VARCHAR(50) NULL"
    );
    await ensureColumn(
      "owner_id",
      "ALTER TABLE sales_types ADD COLUMN owner_id VARCHAR(100) NULL"
    );

    /* =========================================================
       ✅ SAFE INSERT (AUTO_INCREMENT id)
       ========================================================= */

    const [result] = await db.query(
      `
      INSERT INTO sales_types
        (sales_type, type, prefix, suffix, current_no, company_id, owner_type, owner_id)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        sales_type,
        type,
        prefix || "",
        suffix || "",
        currentNo,
        company_id,
        owner_type,
        owner_id,
      ]
    );

    return res.json({
      success: true,
      message: "Sales type created successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating sales type:", err);
    return res.status(500).json({
      success: false,
      message: "Error creating sales type",
    });
  }
});

// Update sales type

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    sales_type,
    type,
    prefix,
    suffix,
    current_no,
    company_id,
    owner_type,
    owner_id,
  } = req.body || {};

  // 🔒 Block system defined sales types
  if (Number(id) < 0) {
    return res.status(403).json({
      success: false,
      message: "System sales type cannot be modified",
    });
  }

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

  const currentNo = Number.isFinite(Number(current_no))
    ? Number(current_no)
    : 1;

  try {
    const [result] = await db.query(
      `
      UPDATE sales_types
      SET
        sales_type = ?,
        type = ?,
        prefix = ?,
        suffix = ?,
        current_no = ?
      WHERE id = ?
        AND company_id = ?
        AND owner_type = ?
        AND owner_id = ?
      `,
      [
        sales_type,
        type,
        prefix || "",
        suffix || "",
        currentNo,
        id,
        company_id,
        owner_type,
        owner_id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Sales type not found or not allowed",
      });
    }

    res.json({
      success: true,
      message: "Sales type updated successfully",
    });
  } catch (err) {
    console.error("Error updating sales type:", err);
    res.status(500).json({
      success: false,
      message: "Error updating sales type",
    });
  }
});

// Delete sales type
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  // 🔒 Block system rows
  if (Number(id) < 0) {
    return res.status(403).json({
      success: false,
      message: "System sales type cannot be deleted",
    });
  }

  try {
    const [result] = await db.query("DELETE FROM sales_types WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Sales type not found",
      });
    }

    res.json({ success: true, message: "Sales type deleted" });
  } catch (err) {
    console.error("Error deleting sales type:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting sales type",
    });
  }
});

module.exports = router;
