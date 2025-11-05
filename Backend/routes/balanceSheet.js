const express = require('express');
const router = express.Router();
const pool = require('../db'); // your mysql2 connection pool

// GET /api/balance-sheet
router.get('/api/balance-sheet', async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ error: 'Missing tenant parameters' });
  }

  try {
    // Fetch only groups for this tenant (if groups are tenant-specific)
    const [ledgerGroups] = await pool.query(`
      SELECT id, name, type 
      FROM ledger_groups 
      WHERE company_id = ? AND owner_type = ? AND owner_id = ?`,
      [company_id, owner_type, owner_id]
    );
    
    // Fetch only ledgers for this tenant
    const [ledgers] = await pool.query(`
      SELECT 
        l.id, 
        l.name, 
        l.group_id,
        CAST(l.opening_balance AS DECIMAL(15,2)) AS opening_balance,
        l.balance_type,
        g.name AS group_name,
        g.type AS group_type
      FROM ledgers l
      LEFT JOIN ledger_groups g
        ON l.group_id = g.id
      WHERE l.company_id = ? AND l.owner_type = ? AND l.owner_id = ?
      ORDER BY g.type, g.name, l.name
    `, [company_id, owner_type, owner_id]);

    res.json({ ledgerGroups, ledgers });
  } catch (err) {
    console.error('Error fetching balance sheet data', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
