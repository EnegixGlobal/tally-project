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
    companyId,
    ownerType,
    ownerId
  } = req.body;

  if (!companyId || !ownerType || !ownerId || !id || !name || !fromDate || !toDate) {
    return res.status(400).json({ message: 'companyId, ownerType, ownerId, id, name, fromDate, and toDate are required.' });
  }

  const sql = `
    INSERT INTO scenarios (
      id, name, include_actuals,
      included_voucher_types, excluded_voucher_types,
      from_date, to_date, created_at, updated_at,
      company_id, owner_type, owner_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    companyId,
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

module.exports = router;
