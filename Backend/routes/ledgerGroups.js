const express = require('express');
const router = express.Router();
const db = require('../db');

// const checkPermission = require('../middlewares/checkPermission');
// =========================
// GET groups (RBAC protected)
// =========================
router.get('/', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ message: "company_id, owner_type, and owner_id are required" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT *
       FROM ledger_groups
       WHERE (company_id = ? AND owner_type = ? AND owner_id = ?) 
       OR (company_id = 0 AND owner_type = 'employee' AND owner_id = 0)
       ORDER BY name`,
      [company_id, owner_type, owner_id]
    );

    // console.log('rows', rows)
    res.json(rows);
  } catch (err) {
    console.error('Error fetching ledger groups:', err);
    res.status(500).json({ message: 'Failed to fetch ledger groups' });
  }
});

module.exports = router;
