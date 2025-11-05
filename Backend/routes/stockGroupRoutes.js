const express = require('express');
const router = express.Router();
const db = require('../db');

// Create new stock group (multi-tenant, role-scoped)
router.post('/', async (req, res) => {
  const s = req.body;
  const { companyId, ownerType, ownerId } = s;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ message: 'companyId, ownerType, and ownerId are required.' });
  }

  try {
    const sql = `
      INSERT INTO stock_groups 
      (id, name, parent, should_quantities_be_added, set_alter_hsn, hsn_sac_classification_id, hsn_code, hsn_description, 
      set_alter_gst, gst_classification_id, taxability, gst_rate, cess,
      company_id, owner_type, owner_id, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      s.id, s.name, s.parent || null, s.shouldQuantitiesBeAdded,
      s.hsnSacDetails?.setAlterHSNSAC || false,
      s.hsnSacDetails?.hsnSacClassificationId || null,
      s.hsnSacDetails?.hsnCode || null,
      s.hsnSacDetails?.description || null,
      s.gstDetails?.setAlterGST || false,
      s.gstDetails?.gstClassificationId || null,
      s.gstDetails?.taxability || null,
      s.gstDetails?.integratedTaxRate || 0,
      s.gstDetails?.cess || 0,
      companyId,
      ownerType,
      ownerId
    ];

    await db.execute(sql, values);
    res.json({ message: 'Stock Group added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to insert', details: err.message });
  }
});

// Get all Stock Groups for this tenant+role
router.get('/list', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required.' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM stock_groups WHERE company_id = ? AND owner_type = ? AND owner_id = ? ORDER BY created_at DESC',
      [company_id, owner_type, owner_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching stock groups:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stock groups' });
  }
});

// Delete Stock Group (multi-tenant scoped)
router.delete('/delete/:id', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  const { id } = req.params;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required.' });
  }

  try {
    const [result] = await db.execute(
      'DELETE FROM stock_groups WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?',
      [id, company_id, owner_type, owner_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Stock group not found or unauthorized' });
    }
    res.json({ success: true, message: 'Stock Group deleted successfully' });
  } catch (err) {
    console.error('Error deleting stock group:', err);
    res.status(500).json({ success: false, message: 'Failed to delete stock group' });
  }
});

module.exports = router;
