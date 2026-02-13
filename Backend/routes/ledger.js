const express = require("express");
const router = express.Router();
const db = require("../db"); // your MySQL pool
// const checkPermission = require('../middlewares/checkPermission');

// Get Ledgers scoped by company and owner
router.get("/", async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({
      message: "company_id, owner_type and owner_id are required",
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT 
        l.id,
        l.name,
        l.group_id AS groupId,
        l.opening_balance AS openingBalance,
        l.closing_balance AS closingBalance,
        l.balance_type AS balanceType,
        l.address,
        l.email,
        l.phone,
        l.gst_number AS gstNumber,
        l.pan_number AS panNumber,
        l.state,
        l.district,
        l.created_at AS createdAt,
        g.name AS groupName,
        g.type AS groupType,
        g.nature AS groupNature
      FROM ledgers l
      LEFT JOIN ledger_groups g ON l.group_id = g.id
      WHERE l.company_id = ?
        AND l.owner_type = ?
        AND (l.owner_id = ? OR l.owner_id = 0)
      ORDER BY l.name`,
      [company_id, owner_type, owner_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching ledgers:", err);
    res.status(500).json({ message: "Failed to fetch ledgers" });
  }
});

// Create a new ledger scoped by company and owner
router.post("/", async (req, res) => {
  const {
    name,
    groupId,
    openingBalance,
    closingBalance,
    balanceType,
    address,
    email,
    phone,
    gstNumber,
    panNumber,
    state,
    district,
    companyId,
    ownerType,
    ownerId,
  } = req.body;

  if (!companyId || !ownerType || !ownerId || !name || !groupId) {
    return res.status(400).json({
      message: "companyId, ownerType, ownerId, name, and groupId are required",
    });
  }

  try {
    // 🔍 Check if columns exist and add if missing
    const [colClosing] = await db.execute(`
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ledgers'
    AND COLUMN_NAME = 'closing_balance';
  `);

    if (colClosing.length === 0) {
      await db.execute(`
      ALTER TABLE ledgers
      ADD COLUMN closing_balance DECIMAL(15,2) DEFAULT 0;
    `);
    }

    // Check for state column
    const [colState] = await db.execute(`
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ledgers'
    AND COLUMN_NAME = 'state';
  `);

    if (colState.length === 0) {
      await db.execute(`
      ALTER TABLE ledgers
      ADD COLUMN state VARCHAR(100) DEFAULT '';
    `);
    }

    // Check for district column
    const [colDistrict] = await db.execute(`
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ledgers'
    AND COLUMN_NAME = 'district';
  `);

    if (colDistrict.length === 0) {
      await db.execute(`
      ALTER TABLE ledgers
      ADD COLUMN district VARCHAR(100) DEFAULT '';
    `);
    }

    // 🔁 Auto handle missing closingBalance
    const finalClosingBalance =
      closingBalance !== undefined ? closingBalance : openingBalance || 0;

    const sql = `
    INSERT INTO ledgers 
    (name, group_id, opening_balance, closing_balance, balance_type, address, email, phone, gst_number, pan_number, state, district, company_id, owner_type, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    await db.execute(sql, [
      name,
      groupId,
      openingBalance || 0,
      finalClosingBalance,
      balanceType || "debit",
      address || "",
      email || "",
      phone || "",
      gstNumber || "",
      panNumber || "",
      state || "",
      district || "",
      companyId,
      ownerType,
      ownerId,
    ]);

    res.status(201).json({ message: "Ledger created successfully" });
  } catch (err) {
    console.error("Error creating ledger:", err);
    res.status(500).json({ message: "Failed to create ledger" });
  }
});

// Get only Cash/Bank Ledgers (for Contra Voucher)
router.get("/cash-bank", async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  try {
    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        message: "companyId, ownerType, and ownerId are required",
      });
    }

    const [rows] = await db.execute(
      `
      SELECT 
        l.id,
        l.name,
        l.created_at AS createdAt,
        g.name AS groupName
      FROM ledgers l
      INNER JOIN ledger_groups g ON l.group_id = g.id
      WHERE 
        (
          LOWER(l.name) LIKE '%cash%' OR 
          LOWER(l.name) LIKE '%bank%' OR
          LOWER(g.name) LIKE '%cash%' OR 
          LOWER(g.name) LIKE '%bank%'
        )
        AND l.company_id = ?
        AND l.owner_type = ?
        AND l.owner_id = ?
      ORDER BY l.name ASC
      `,
      [company_id, owner_type, owner_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching cash/bank ledgers:", err);
    res.status(500).json({ message: "Failed to fetch cash/bank ledgers" });
  }
});

// Create multiple ledgers in bulk
router.post("/bulk", async (req, res) => {
  const { ledgers, companyId, ownerType, ownerId } = req.body;

  // Validate top-level tenant ownership required
  if (!companyId || !ownerType || !ownerId) {
    return res
      .status(400)
      .json({ message: "companyId, ownerType, and ownerId are required" });
  }

  if (!ledgers || !Array.isArray(ledgers) || ledgers.length === 0) {
    return res.status(400).json({ message: "Invalid ledgers data" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Check if state and district columns exist, add if missing
    const [colState] = await connection.execute(`
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ledgers'
    AND COLUMN_NAME = 'state';
  `);

    if (colState.length === 0) {
      await connection.execute(`
      ALTER TABLE ledgers
      ADD COLUMN state VARCHAR(100) DEFAULT '';
    `);
    }

    const [colDistrict] = await connection.execute(`
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ledgers'
    AND COLUMN_NAME = 'district';
  `);

    if (colDistrict.length === 0) {
      await connection.execute(`
      ALTER TABLE ledgers
      ADD COLUMN district VARCHAR(100) DEFAULT '';
    `);
    }

    const sql = `
      INSERT INTO ledgers 
      (name, group_id, opening_balance, balance_type, address, email, phone, gst_number, pan_number, state, district, company_id, owner_type, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const results = [];

    for (const ledger of ledgers) {
      const {
        name,
        groupId,
        openingBalance,
        balanceType,
        address,
        email,
        phone,
        gstNumber,
        panNumber,
        state,
        district,
      } = ledger;

      //  Validate required fields
      if (!name || !groupId) {
        throw new Error(
          `Missing required fields for ledger: ${name || "Unknown"}`
        );
      }

      await connection.execute(sql, [
        name,
        groupId,
        openingBalance || 0,
        balanceType || "debit",
        address || "",
        email || "",
        phone || "",
        gstNumber || "",
        panNumber || "",
        state || "",
        district || "",
        companyId,
        ownerType,
        ownerId,
      ]);

      results.push({ name, status: "created" });
    }

    await connection.commit();
    res.status(201).json({
      message: `${results.length} ledger(s) created successfully!`,
      results,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Bulk ledger insert error:", err);
    res.status(500).json({
      message: "Failed to create ledgers",
      error: err.message,
    });
  } finally {
    connection.release();
  }
});

// Get ledger by ID
router.get("/:id", async (req, res) => {
  const ledgerId = parseInt(req.params.id, 10);
  const { owner_type, owner_id, company_id } = req.query;

  if (isNaN(ledgerId)) {
    return res.status(400).json({ message: "Invalid ledger ID" });
  }

  if (!owner_type || !owner_id || !company_id) {
    return res.status(400).json({
      message:
        "Missing required query params: owner_type, owner_id, company_id",
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT 
        l.*, 
        g.id AS groupId, 
        g.name AS groupName
       FROM ledgers l
       LEFT JOIN ledger_groups g ON l.group_id = g.id
       WHERE l.id = ? 
       AND l.owner_type = ?
       AND l.owner_id = ?
       AND l.company_id = ?`,
      [ledgerId, owner_type, owner_id, company_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // res.json(rows[0]);
    const ledger = rows[0];

    res.json({
      id: ledger.id,
      name: ledger.name,
      groupId: ledger.group_id, // FIXED
      openingBalance: ledger.opening_balance,
      closingBalance: ledger.closing_balance,
      balanceType: ledger.balance_type,
      address: ledger.address,
      email: ledger.email,
      phone: ledger.phone,
      gstNumber: ledger.gst_number,
      panNumber: ledger.pan_number,
      state: ledger.state || "",
      district: ledger.district || "",
      createdAt: ledger.created_at,
      groupName: ledger.groupName,
    });
  } catch (err) {
    console.error("Error fetching ledger by ID:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a ledger by ID
router.put("/:id", async (req, res) => {
  const ledgerId = parseInt(req.params.id, 10);
  const { owner_type, owner_id, company_id } = req.query;

  const {
    name,
    groupId,
    openingBalance,
    balanceType,
    address,
    email,
    phone,
    gstNumber,
    panNumber,
    state,
    district,
    closingBalance,
  } = req.body;

  if (isNaN(ledgerId)) {
    return res.status(400).json({ message: "Invalid ledger ID" });
  }

  if (!owner_type || !owner_id || !company_id) {
    return res.status(400).json({
      message:
        "Missing required query params: owner_type, owner_id, company_id",
    });
  }

  try {
    // Check if state and district columns exist, add if missing
    const [colState] = await db.execute(`
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ledgers'
    AND COLUMN_NAME = 'state';
  `);

    if (colState.length === 0) {
      await db.execute(`
      ALTER TABLE ledgers
      ADD COLUMN state VARCHAR(100) DEFAULT '';
    `);
    }

    const [colDistrict] = await db.execute(`
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ledgers'
    AND COLUMN_NAME = 'district';
  `);

    if (colDistrict.length === 0) {
      await db.execute(`
      ALTER TABLE ledgers
      ADD COLUMN district VARCHAR(100) DEFAULT '';
    `);
    }

    const sql = `
      UPDATE ledgers
      SET name = ?, 
          group_id = ?, 
          opening_balance = ?, 
          balance_type = ?,
          address = ?, 
          email = ?, 
          phone = ?, 
          gst_number = ?, 
          pan_number = ?,
          state = ?,
          district = ?,
          closing_balance = ?
      WHERE id = ? 
      AND owner_type = ?
      AND owner_id = ? 
      AND company_id = ?
    `;

    const [result] = await db.execute(sql, [
      name,
      groupId,
      openingBalance || 0,
      balanceType || "debit",
      address || "",
      email || "",
      phone || "",
      gstNumber || "",
      panNumber || "",
      state || "",
      district || "",
      closingBalance !== undefined ? closingBalance : openingBalance || 0,
      ledgerId,
      owner_type,
      owner_id,
      company_id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Ledger not found or unauthorized" });
    }

    res.json({ message: "Ledger updated successfully" });
  } catch (err) {
    console.error("Error updating ledger:", err);
    res.status(500).json({ message: "Failed to update ledger" });
  }
});

// Delete a ledger by ID
router.delete("/:id", async (req, res) => {
  const ledgerId = parseInt(req.params.id, 10);

  if (isNaN(ledgerId)) {
    return res.status(400).json({ message: "Invalid ledger ID" });
  }

  try {
    // 1️⃣ Ledger exist check
    const [ledgerRows] = await db.execute(
      "SELECT id FROM ledgers WHERE id = ?",
      [ledgerId]
    );

    if (ledgerRows.length === 0) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // 2️⃣ sales_vouchers check
    const [salesVoucher] = await db.execute(
      "SELECT 1 FROM sales_vouchers WHERE partyId = ? LIMIT 1",
      [ledgerId]
    );
    if (salesVoucher.length) {
      return res.status(400).json({
        message: "Ledger used in Sales Voucher, cannot delete",
      });
    }

    // 3️⃣ purchase_orders check
    const [purchaseOrder] = await db.execute(
      "SELECT 1 FROM purchase_orders WHERE party_id = ? LIMIT 1",
      [ledgerId]
    );
    if (purchaseOrder.length) {
      return res.status(400).json({
        message: "Ledger used in Purchase Order, cannot delete",
      });
    }

    // 4️⃣ sales_orders check
    const [salesOrder] = await db.execute(
      "SELECT 1 FROM sales_orders WHERE partyId = ? LIMIT 1",
      [ledgerId]
    );
    if (salesOrder.length) {
      return res.status(400).json({
        message: "Ledger used in Sales Order, cannot delete",
      });
    }

    // 5️⃣ voucher_entries check
    const [voucherEntries] = await db.execute(
      "SELECT 1 FROM voucher_entries WHERE ledger_id = ? LIMIT 1",
      [ledgerId]
    );
    if (voucherEntries.length) {
      return res.status(400).json({
        message: "Ledger used in Vouchers, cannot delete",
      });
    }

    // 6️⃣ SAFE DELETE
    await db.execute("DELETE FROM ledgers WHERE id = ?", [ledgerId]);

    res.json({ message: "Ledger deleted successfully" });
  } catch (err) {
    console.error("Error deleting ledger:", err);
    res.status(500).json({ message: "Failed to delete ledger" });
  }
});

//patch closing balance
router.patch("/", async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  const { ledgerId, closingBalance } = req.body;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({
      message: "company_id, owner_type and owner_id are required",
    });
  }

  if (!ledgerId || closingBalance === undefined) {
    return res.status(400).json({
      message: "ledgerId and closingBalance are required",
    });
  }

  try {
    const [result] = await db.execute(
      `
      UPDATE ledgers
      SET closing_balance = ?
      WHERE id = ?
        AND company_id = ?
        AND owner_type = ?
        AND (owner_id = ? OR owner_id = 0)
      `,
      [closingBalance, ledgerId, company_id, owner_type, owner_id]
    );

    res.json({
      success: true,
      message: "Closing balance updated successfully",
    });
  } catch (err) {
    console.error("Closing balance update error:", err);
    res.status(500).json({
      message: "Failed to update closing balance",
    });
  }
});


module.exports = router;
