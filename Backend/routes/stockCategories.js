const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all stock categories scoped to tenant+role
router.get('/', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }
  try {
    const [rows] = await db.execute(
      'SELECT * FROM stock_categories WHERE company_id = ? AND owner_type = ? AND owner_id = ? ORDER BY name',
      [company_id, owner_type, owner_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching stock categories:', err);
    res.status(500).json({ message: 'Failed to fetch stock categories' });
  }
});

// GET single stock category (scoped)
router.get('/:id', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }
  try {
    const [rows] = await db.execute(
      'SELECT * FROM stock_categories WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?',
      [req.params.id, company_id, owner_type, owner_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching stock category:', err);
    res.status(500).json({ message: 'Failed to fetch stock category' });
  }
});

// CREATE stock category (multi-tenant scoped)
router.post('/', async (req, res) => {
  const { id, name, parent, description, companyId, ownerType, ownerId } = req.body;
  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ message: 'companyId, ownerType, and ownerId are required' });
  }
  try {
    await db.execute(
      'INSERT INTO stock_categories (id, name, parent, description, company_id, owner_type, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, parent || null, description || null, companyId, ownerType, ownerId]
    );
    res.json({ message: 'Stock category created successfully' });
  } catch (err) {
    console.error('Error creating stock category:', err);
    res.status(500).json({ message: 'Failed to create stock category' });
  }
});

// UPDATE stock category (scoped)
router.put('/:id', async (req, res) => {
  const { name, parent, description, companyId, ownerType, ownerId } = req.body;
  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ message: 'companyId, ownerType, and ownerId are required' });
  }
  try {
    const [result] = await db.execute(
      'UPDATE stock_categories SET name = ?, parent = ?, description = ? WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?',
      [name, parent || null, description || null, req.params.id, companyId, ownerType, ownerId]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Stock category not found' });
    res.json({ message: 'Stock category updated successfully' });
  } catch (err) {
    console.error('Error updating stock category:', err);
    res.status(500).json({ message: 'Failed to update stock category' });
  }
});

// DELETE stock category (scoped)
router.delete('/:id', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }
  try {
    const [result] = await db.execute(
      'DELETE FROM stock_categories WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?',
      [req.params.id, company_id, owner_type, owner_id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Stock category not found' });
    res.json({ message: 'Stock category deleted successfully' });
  } catch (err) {
    console.error('Error deleting stock category:', err);
    res.status(500).json({ message: 'Failed to delete stock category' });
  }
});

module.exports = router;
