const express = require('express');
const router = express.Router();
const db = require('../db'); // your db connection (mysql2 or mysql)

// POST /api/budgets - Create a new budget (scoped)
router.post('/', async (req, res) => {
  const { name, startDate, endDate, description, status, companyId, ownerType, ownerId } = req.body;

  if (!companyId || !ownerType || !ownerId || !name || !startDate || !endDate) {
    return res.status(400).json({ message: 'companyId, ownerType, ownerId, name, startDate and endDate are required.' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO budgets (name, start_date, end_date, description, status, company_id, owner_type, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, startDate, endDate, description, status, companyId, ownerType, ownerId]
    );

    res.status(201).json({ message: 'Budget created successfully.', id: result.insertId });
  } catch (err) {
    console.error('Budget insert error:', err);
    res.status(500).json({ message: 'Failed to create budget.' });
  }
});

// GET /api/budgets - Fetch all budgets scoped by tenant and owner
router.get('/', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required.' });
  }

  try {
    const [results] = await db.execute(
      `SELECT * FROM budgets WHERE company_id = ? AND owner_type = ? AND owner_id = ? ORDER BY id DESC`,
      [company_id, owner_type, owner_id]
    );

    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ message: 'Error fetching budgets' });
  }
});

// PUT /api/budgets/:id - Update budget scoped to tenant and owner
router.put('/:id', async (req, res) => {
  const { name, startDate, endDate, description, status, companyId, ownerType, ownerId } = req.body;
  const id = req.params.id;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ message: 'companyId, ownerType, and ownerId are required.' });
  }

  try {
    const [result] = await db.execute(
      `UPDATE budgets SET name = ?, start_date = ?, end_date = ?, description = ?, status = ?
       WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?`,
      [name, startDate, endDate, description, status, id, companyId, ownerType, ownerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Budget not found or unauthorized' });
    }

    res.json({ message: 'Budget updated successfully' });
  } catch (err) {
    console.error('Update budget error:', err);
    res.status(500).json({ message: 'Update failed', error: err });
  }
});



// routes/budgets.js
router.get('/:id', async (req, res) => {
  const budgetId = parseInt(req.params.id, 10);
  const { company_id, owner_type, owner_id } = req.query;

  if (isNaN(budgetId)) {
    return res.status(400).json({ message: 'Invalid budget ID' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT * FROM budgets
       WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?`,
      [budgetId, company_id, owner_type, owner_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching budget:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { company_id, owner_type, owner_id } = req.query;

  try {
    // (optional) verify that this budget belongs to the company/owner
    const [rows] = await db.query(
      'SELECT * FROM budgets WHERE id = ? AND company_id = ?',
      [id, company_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // delete the budget
    await db.query('DELETE FROM budgets WHERE id = ?', [id]);

    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    console.error('Error deleting budget:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
