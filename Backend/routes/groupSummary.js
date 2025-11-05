const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/group-summary
// Query params: groupType (optional), company_id, owner_type, owner_id (all required for tenant)
router.get('/api/group-summary', async (req, res) => {
  const { groupType, company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ error: 'Missing tenant parameters (company_id, owner_type, owner_id) required.' });
  }

  try {
    // Fetch tenant's ledger groups
    const [ledgerGroups] = await pool.query(
      'SELECT id, name, type FROM ledger_groups WHERE company_id = ? AND owner_type = ? AND owner_id = ?',
      [company_id, owner_type, owner_id]
    );

    // Build ledgers query - always filter by tenant, optionally filter by groupType
    let ledgersSql = `
      SELECT 
        l.id, l.name, l.group_id, l.opening_balance, l.balance_type,
        g.name AS group_name, g.type AS group_type
      FROM ledgers l
      LEFT JOIN ledger_groups g ON l.group_id = g.id
      WHERE l.company_id = ? AND l.owner_type = ? AND l.owner_id = ?
    `;
    const params = [company_id, owner_type, owner_id];

    if (groupType) {
      ledgersSql += ' AND g.type = ?';
      params.push(groupType);
    }
    ledgersSql += ' ORDER BY l.name';

    // Fetch ledgers with filters
    const [ledgers] = await pool.query(ledgersSql, params);

    // Normalize opening_balance for frontend
    const normalizedLedgers = ledgers.map(ledger => ({
      ...ledger,
      opening_balance: parseFloat(ledger.opening_balance) || 0,
    }));

    res.json({
      ledgerGroups,
      ledgers: normalizedLedgers,
    });
  } catch (error) {
    console.error('Error fetching group summary data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
