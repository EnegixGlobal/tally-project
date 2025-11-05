const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all units
router.get('/', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM stock_units WHERE company_id = ? AND owner_type = ? AND owner_id = ? ORDER BY id DESC', [company_id, owner_type, owner_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching units', error: err });
  }
});

// Get single unit
router.get('/:id', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM stock_units WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?', [req.params.id, company_id, owner_type, owner_id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Unit not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching unit', error: err });
  }
});

// Create unit
router.post('/', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }
  const { name, symbol } = req.body;
  if (!name || !symbol) return res.status(400).json({ message: 'Name and symbol are required' });

  try {
    await db.query('INSERT INTO stock_units (name, symbol, company_id, owner_type, owner_id) VALUES (?, ?, ?, ?, ?)', [name, symbol, company_id, owner_type, owner_id]);
    res.json({ message: 'Unit created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating unit', error: err });
  }
});

// Update unit
router.put('/:id', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }
  const { name, symbol } = req.body;
  try {
    const [result] = await db.query('UPDATE stock_units SET name = ?, symbol = ? WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?', [name, symbol, req.params.id, company_id, owner_type, owner_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Unit not found' });
    res.json({ message: 'Unit updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating unit', error: err });
  }
});

// Delete unit
router.delete('/:id', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }
  try {
    const [result] = await db.query('DELETE FROM stock_units WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?', [req.params.id, company_id, owner_type, owner_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Unit not found' });
    res.json({ message: 'Unit deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting unit', error: err });
  }
});

module.exports = router;
