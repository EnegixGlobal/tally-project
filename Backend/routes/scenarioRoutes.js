const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/scenario/create
router.post('/create', async (req, res) => {
  const {
    id,
    name,
    includeActuals,
    includedVoucherTypes,
    excludedVoucherTypes,
    fromDate,
    toDate,
    createdAt,
    updatedAt,
    ownerType,
    ownerId
  } = req.body;

 

  // 🧩 Validation (companyId removed)
  if (!ownerType || !ownerId || !id || !name || !fromDate || !toDate) {
    return res.status(400).json({
      message: 'ownerType, ownerId, id, name, fromDate, and toDate are required.'
    });
  }


  const sql = `
    INSERT INTO scenarios (
      id, name, include_actuals,
      included_voucher_types, excluded_voucher_types,
      from_date, to_date, created_at, updated_at,
      owner_type, owner_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;


  const values = [
    id,
    name,
    includeActuals,
    JSON.stringify(includedVoucherTypes),
    JSON.stringify(excludedVoucherTypes),
    fromDate,
    toDate,
    createdAt,
    updatedAt || null,
    ownerType,
    ownerId
  ];

  try {
    await db.execute(sql, values);
    res.status(200).json({ message: 'Scenario created successfully' });
  } catch (err) {
    console.error('❌ Error inserting scenario:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/scenario/list
router.get('/list', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: 'company_id, owner_type, and owner_id are required.' });
  }

  const sql = `
    SELECT * FROM scenarios 
    WHERE company_id = ? AND owner_type = ? AND owner_id = ?
    ORDER BY created_at DESC
  `;

  try {
    const [rows] = await db.execute(sql, [company_id, owner_type, owner_id]);
    // Convert JSON string fields back to arrays & boolean
    const scenarios = rows.map(row => ({
      ...row,
      included_voucher_types: JSON.parse(row.included_voucher_types || '[]'),
      excluded_voucher_types: JSON.parse(row.excluded_voucher_types || '[]'),
      include_actuals: !!row.include_actuals
    }));
    res.status(200).json(scenarios);
  } catch (err) {
    console.error('❌ Error fetching scenarios:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

//Get/:id
// GET /api/scenario/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { company_id, owner_type, owner_id } = req.query;

  // Validation
  if (!id || !company_id || !owner_type || !owner_id) {
    return res.status(400).json({
      message: 'id, company_id, owner_type, and owner_id are required.',
    });
  }

  const sql = `
    SELECT * FROM scenarios
    WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?
    LIMIT 1
  `;

  try {
    const [rows] = await db.execute(sql, [id, company_id, owner_type, owner_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Scenario not found or unauthorized access.' });
    }

    const row = rows[0];

    // Convert JSON string fields back to arrays & boolean
    const scenario = {
      ...row,
      included_voucher_types: JSON.parse(row.included_voucher_types || '[]'),
      excluded_voucher_types: JSON.parse(row.excluded_voucher_types || '[]'),
      include_actuals: !!row.include_actuals,
    };

    res.status(200).json(scenario);
  } catch (err) {
    console.error('❌ Error fetching scenario:', err);
    res.status(500).json({ error: 'Database error during scenario fetch.' });
  }
});

//Put/:id

// PUT /api/scenario/update/:id
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const {
  
    owner_type,
    owner_id,
    name,
    fromDate,
    toDate,
    includeActuals,
    includedVoucherTypes,
    excludedVoucherTypes,
  } = req.body;

  // Validation
  if (!id  || !owner_type || !owner_id) {
    return res.status(400).json({
      message: 'id, company_id, owner_type, and owner_id are required.',
    });
  }

  try {
    const sql = `
      UPDATE scenarios
      SET 
        name = ?, 
        from_date = ?, 
        to_date = ?, 
        include_actuals = ?, 
        included_voucher_types = ?, 
        excluded_voucher_types = ?, 
        updated_at = NOW()
      WHERE id = ?  AND owner_type = ? AND owner_id = ?
    `;

    const params = [
      name,
      fromDate,
      toDate,
      includeActuals ? 1 : 0,
      JSON.stringify(includedVoucherTypes || []),
      JSON.stringify(excludedVoucherTypes || []),
      id,
    
      owner_type,
      owner_id,
    ];

    const [result] = await db.execute(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Scenario not found or you do not have permission to update it.',
      });
    }

    res.status(200).json({
      message: 'Scenario updated successfully!',
      updatedId: id,
    });
  } catch (err) {
    console.error('❌ Error updating scenario:', err);
    res.status(500).json({ error: 'Database error during scenario update.' });
  }
});



//Delete
// DELETE /api/scenario/delete/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { company_id, owner_type, owner_id } = req.query;

  // Validation
  if (!id ||  !owner_type || !owner_id) {
    return res.status(400).json({ message: 'id, company_id, owner_type, and owner_id are required.' });
  }

  try {
    // First check if scenario exists and belongs to this company/user
    const [rows] = await db.execute(
      `SELECT id FROM scenarios WHERE id = ? AND company_id = ? AND owner_type = ? AND owner_id = ?`,
      [id, company_id, owner_type, owner_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Scenario not found or unauthorized access.' });
    }

    // Delete the scenario
    await db.execute(`DELETE FROM scenarios WHERE id = ?`, [id]);

    res.status(200).json({ message: 'Scenario deleted successfully.' });
  } catch (err) {
    console.error('❌ Error deleting scenario:', err);
    res.status(500).json({ error: 'Database error during deletion.' });
  }
});


module.exports = router;
