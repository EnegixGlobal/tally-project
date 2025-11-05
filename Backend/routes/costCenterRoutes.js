const express = require('express');
const router = express.Router();
const db = require('../db');

// Create or Update Cost Center (multi-tenant + role scoped)
router.post('/save', async (req, res) => {
  const { id, name, category, description, companyId, ownerType, ownerId } = req.body;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ message: 'companyId, ownerType, and ownerId are required.' });
  }

  try {
    if (id) {
      // Update existing cost center only if it belongs to current tenant + role
      const [result] = await db.execute(
        `UPDATE cost_centers SET name=?, category=?, description=?, updated_at=NOW()
         WHERE id=? AND company_id=? AND owner_type=? AND owner_id=?`,
        [name, category, description, id, companyId, ownerType, ownerId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Cost center not found or unauthorized' });
      }

      res.json({ success: true, message: 'Cost center updated successfully' });
    } else {
      // Insert new cost center with tenant + role scope
      await db.execute(
        `INSERT INTO cost_centers (name, category, description, company_id, owner_type, owner_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [name, category, description, companyId, ownerType, ownerId]
      );
      res.json({ success: true, message: 'Cost center created successfully' });
    }
  } catch (err) {
    console.error('Error saving cost center:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


router.put('/:id', async (req, res) => {
  const { name, category, description, companyId, ownerType, ownerId } = req.body;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ message: 'companyId, ownerType, and ownerId are required.' });
  }

  try {
    const [result] = await db.execute(
      `UPDATE cost_centers 
       SET name=?, category=?, description=?, updated_at=NOW()
       WHERE id=? AND company_id=? AND owner_type=? AND owner_id=?`,
      [name, category, description, req.params.id, companyId, ownerType, ownerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cost center not found or unauthorized' });
    }

    res.json({ success: true, message: 'Cost center updated successfully' });
  } catch (err) {
    console.error('Error updating cost center:', err);
    res.status(500).json({ error: 'Database error' });
  }
});




router.delete('/:id', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }

  try {
    const [result] = await db.execute(
      `DELETE FROM cost_centers WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?`,
      [req.params.id, company_id, owner_type, owner_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cost center not found or unauthorized' });
    }

    res.json({ success: true, message: 'Cost center deleted successfully' });
  } catch (err) {
    console.error('Error deleting cost center:', err);
    res.status(500).json({ error: 'Database error' });
  }
});





// Get Cost Center by ID
router.get('/:id', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT * FROM cost_centers WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?`,
      [req.params.id, company_id, owner_type, owner_id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching cost center:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// List all cost centers scoped to tenant + role
router.get('/list/all', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT * FROM cost_centers WHERE company_id = ? AND owner_type = ? AND owner_id = ? ORDER BY created_at DESC`,
      [company_id, owner_type, owner_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error listing cost centers:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete cost center scoped by tenant + role
router.delete('/:id', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required' });
  }

  try {
    const [result] = await db.execute(
      `DELETE FROM cost_centers WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?`,
      [req.params.id, company_id, owner_type, owner_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cost center not found or unauthorized' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting cost center:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
