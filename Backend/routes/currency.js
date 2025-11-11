const express = require('express');
const router = express.Router();
const db = require('../db'); // your MySQL pool

// Get Currencies scoped by company and owner
router.get('/', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: "company_id, owner_type and owner_id are required" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT id, code, symbol, name, exchange_rate AS exchangeRate, is_base AS isBase 
       FROM currencies 
       WHERE company_id = ? AND owner_type = ? AND owner_id = ? 
       ORDER BY id DESC`,
      [company_id, owner_type, owner_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching currencies:", err);
    res.status(500).json({ message: "Failed to fetch currencies" });
  }
});

// Create a new currency scoped by company and owner
router.post('/', async (req, res) => {
  const {
    code,
    symbol,
    name,
    exchangeRate,
    isBase,
    companyId,
    ownerType,
    ownerId
  } = req.body;

  if (!code || !name || !companyId || !ownerType || !ownerId) {
    return res.status(400).json({ message: "code, name, companyId, ownerType, and ownerId are required" });
  }


  
  try {

    // 1️⃣ Check if the currency already exists
    const [existing] = await db.execute(
      `SELECT id FROM currencies 
       WHERE code = ? AND company_id = ? AND owner_type = ? AND owner_id = ?`,
      [code, companyId, ownerType, ownerId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Currency already exists for this company/owner" });
    }




    if (isBase) {
      // Set all others to non-base for this tenant and owner
      await db.execute(
        "UPDATE currencies SET is_base = false WHERE company_id = ? AND owner_type = ? AND owner_id = ?",
        [companyId, ownerType, ownerId]
      );
    }

    await db.execute(
      `INSERT INTO currencies (code, symbol, name, exchange_rate, is_base, company_id, owner_type, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, symbol || '', name, exchangeRate || 1, Boolean(isBase), companyId, ownerType, ownerId]
    );

  

    res.status(201).json({ message: "Currency created successfully" });
  } catch (err) {
    console.error("Error creating currency:", err);
    res.status(500).json({ message: "Failed to create currency" });
  }
});

// You can add additional routes (PUT, DELETE) scoped similarly as needed
// Update a currency by id
router.put('/:id', async (req, res) => {
  const { id } = req.params;


  const { code, symbol, name, exchangeRate, isBase, ownerType, ownerId } = req.body;

  // 🧠 Step 1: Basic validation (no companyId now)
  if (!code || !name || !ownerType || !ownerId) {
    return res.status(400).json({ message: "code, name, ownerType, and ownerId are required" });
  }

  try {
    // 🧠 Step 2: Check if another currency with same code already exists (ignore current ID)
    const [existing] = await db.execute(
      `SELECT id FROM currencies 
       WHERE code = ? AND owner_type = ? AND owner_id = ? AND id != ?`,
      [code, ownerType, ownerId, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Currency already exists for this owner" });
    }

    if (isBase) {
      await db.execute(
        `UPDATE currencies 
         SET is_base = false 
         WHERE owner_type = ? AND owner_id = ? AND id != ?`,
        [ownerType, ownerId, id]
      );
    }

    // 🧠 Step 4: Update the currency
    await db.execute(
      `UPDATE currencies 
       SET code = ?, symbol = ?, name = ?, exchange_rate = ?, is_base = ? 
       WHERE id = ? AND owner_type = ? AND owner_id = ?`,
      [code, symbol || '', name, exchangeRate || 1, Boolean(isBase), id, ownerType, ownerId]
    );

    res.json({ message: "Currency updated successfully" });
  } catch (err) {
    console.error("Error updating currency:", err);
    res.status(500).json({ message: "Failed to update currency" });
  }
});









// Get currency by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: "company_id, owner_type and owner_id are required" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT id, code, symbol, name, exchange_rate AS exchangeRate, is_base AS isBase
       FROM currencies
       WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?`,
      [id, company_id, owner_type, owner_id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Currency not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching currency by ID:", err);
    res.status(500).json({ message: "Failed to fetch currency" });
  }
});




// Delete a currency by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { owner_type, owner_id } = req.query;

  // 🧠 Step 1: Basic validation
  if (!owner_type || !owner_id) {
    return res.status(400).json({ message: "owner_type and owner_id are required" });
  }

  try {
    // 🧠 Step 2: Check if the currency exists and if it's a base currency
    const [rows] = await db.execute(
      `SELECT is_base FROM currencies 
       WHERE id = ? AND owner_type = ? AND owner_id = ?`,
      [id, owner_type, owner_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Currency not found" });
    }

    if (rows[0].is_base) {
      return res.status(400).json({ message: "Cannot delete base currency" });
    }

    // 🧠 Step 3: Delete the currency
    await db.execute(
      `DELETE FROM currencies 
       WHERE id = ? AND owner_type = ? AND owner_id = ?`,
      [id, owner_type, owner_id]
    );

    res.json({ message: "Currency deleted successfully" });
  } catch (err) {
    console.error("Error deleting currency:", err);
    res.status(500).json({ message: "Failed to delete currency" });
  }
});


module.exports = router;
