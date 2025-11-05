const express = require('express');
const router = express.Router();
const pool = require('../db');

function getFinancialYearDates(financialYear) {
  const [startYear, endYear] = financialYear.split('-').map(y => {
    if (y.length === 2) return parseInt('20' + y);
    else return parseInt(y);
  });
  const startDate = `${startYear}-04-01`;
  const endDate = `${endYear}-03-31`;
  return { startDate, endDate };
}

router.get('/', async (req, res) => {
  const { company_id, owner_type, owner_id, financialYear = '2024-25' } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ error: 'Missing tenant parameters (company_id, owner_type, owner_id)' });
  }

  try {
    const { startDate, endDate } = getFinancialYearDates(financialYear);

    // Fetch ledger groups and ledgers for tenant within financial year date range
    const [ledgerGroups] = await pool.query(
      `SELECT id, name, type FROM ledger_groups 
       WHERE company_id = ? AND owner_type = ? AND owner_id = ?`,
      [company_id, owner_type, owner_id]
    );

    const [ledgers] = await pool.query(
      `SELECT l.id, l.name, l.group_id, 
          COALESCE(CAST(l.opening_balance AS DECIMAL(15,2)), 0) AS opening_balance,
          l.balance_type
       FROM ledgers l
       WHERE l.company_id = ? AND l.owner_type = ? AND l.owner_id = ?`,
      [company_id, owner_type, owner_id]
    );

    // Group ledgers by Source / Application categories based on group type
    // Customize group type names below according to your ledger group setup
    const sourceTypes = ['capital', 'retained-earnings', 'long-term-loans', 'depreciation', 'current-liabilities'];
    const applicationTypes = ['fixed-assets', 'current-assets', 'dividends', 'loan-repayments'];

    const sources = [];
    const applications = [];

    ledgerGroups.forEach(group => {
      if (sourceTypes.includes(group.type)) {
        // Ledgers in this group are sources of funds
        ledgers
          .filter(l => l.group_id === group.id)
          .forEach(l => {
            sources.push({
              name: l.name,
              current: l.opening_balance,
              previous: 0,     // You can enhance by fetching previous year balances separately
              change: l.opening_balance,
              isSource: true,
            });
          });
      }

      if (applicationTypes.includes(group.type)) {
        // Ledgers in this group are applications of funds
        ledgers
          .filter(l => l.group_id === group.id)
          .forEach(l => {
            applications.push({
              name: l.name,
              current: l.opening_balance,
              previous: 0,
              change: l.opening_balance,
              isSource: false,
            });
          });
      }
    });

    // Aggregate totals
    const totalSources = sources.reduce((sum, i) => sum + i.change, 0);
    const totalApplications = applications.reduce((sum, i) => sum + i.change, 0);
    const netFundFlow = totalSources - totalApplications;

    // Build response in structure your frontend expects
    const fundFlowData = [
      { category: 'Sources of Funds', items: sources },
      { category: 'Applications of Funds', items: applications }
    ];

    res.json({
      fundFlowData,
      totalSources,
      totalApplications,
      netFundFlow,
    });

  } catch (err) {
    console.error('Error fetching fund flow:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
