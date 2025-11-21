const express = require('express');
const router = express.Router();
const db = require('../db');

// Add Godown (multi-tenant scoped)
router.post('/', async (req, res) => {
  const { name, address, description, companyId, ownerType, ownerId } = req.body;
  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ success: false, message: 'companyId, ownerType, and ownerId are required' });
  }
  try {
    await db.execute(
      'INSERT INTO godowns (name, address, description, company_id, owner_type, owner_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, address, description, companyId, ownerType, ownerId]
    );
    res.json({ success: true, message: 'Godown added successfully' });
  } catch (error) {
    console.error('Error adding godown:', error);
    res.status(500).json({ success: false, message: 'Error adding godown' });
  }
});

// Update Godown (multi-tenant scoped)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address, description, companyId, ownerType, ownerId } = req.body;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({
      success: false,
      message: 'companyId, ownerType, and ownerId are required',
    });
  }

  try {
    const [result] = await db.execute(
      `UPDATE godowns 
       SET name = ?, address = ?, description = ? 
       WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?`,
      [name, address, description, id, companyId, ownerType, ownerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Godown not found or not authorized' });
    }

    res.json({ success: true, message: 'Godown updated successfully' });
  } catch (error) {
    console.error('Error updating godown:', error);
    res.status(500).json({ success: false, message: 'Error updating godown' });
  }
});


// Fetch Godown by ID (multi-tenant scoped)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const {  owner_type, owner_id } = req.query;
  if ( !owner_type || !owner_id) {
    return res.status(400).json({ success: false, message: ' owner_type, and owner_id are required' });
  }
  try {
    const [rows] = await db.execute(
      'SELECT * FROM godowns WHERE id = ? AND owner_type = ? AND owner_id = ?',
      [id, owner_type, owner_id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch godown' });
  }
});

// List All Godowns (multi-tenant scoped)
router.get('/', async (req, res) => {

  const {  owner_type, owner_id } = req.query;
  if (  !owner_type || !owner_id) {
    return res.status(400).json({ success: false, message: 'company_id, owner_type, and owner_id are required' });
  }
  try {
    const [rows] = await db.execute(
      'SELECT * FROM godowns WHERE  owner_type = ? AND owner_id = ? ORDER BY name',
      [ owner_type, owner_id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching godowns' });
  }
});


// Delete Godown (multi-tenant scoped)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const {  owner_type, owner_id } = req.query;

  if ( !owner_type || !owner_id) {
    return res.status(400).json({
      success: false,
      message: ' owner_type, and owner_id are required',
    });
  }

  try {
    const [result] = await db.execute(
      'DELETE FROM godowns WHERE id = ?  AND owner_type = ? AND owner_id = ?',
      [id,  owner_type, owner_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Godown not found or not authorized to delete',
      });
    }

    res.json({ success: true, message: 'Godown deleted successfully' });
  } catch (error) {
    console.error('Error deleting godown:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting godown',
    });
  }
});


module.exports = router;
