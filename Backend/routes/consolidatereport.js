const express = require('express');
const router = express.Router();
const db = require('../db'); // your mysql2 connection pool

router.get('/employee-financial-report', async (req, res) => {
  const employee_id = req.query.employee_id;
  if (!employee_id) return res.status(400).json({ message: "Missing employee_id" });

  const connection = await db.getConnection();
  try {
    // --- Assigned companies
    const [companies] = await connection.query(
      `SELECT id, name FROM tbcompanies WHERE employee_id = ?`,
      [employee_id]
    );

    let balanceRowsMap = {};
    let tradingRowsMap = {};
    let plRowsMap = {};
    let allBalanceGroups = new Set();
    let allPAndLHeads = new Set();

    // --- Balance Sheet with opening balance + transactions ---
    for (const company of companies) {
      const [rows] = await connection.query(
        `SELECT lg.name AS group_name, lg.nature, 
           SUM(l.opening_balance) AS total_opening_balance,
           IFNULL(SUM(CASE WHEN ve.entry_type = 'debit' THEN ve.amount ELSE 0 END),0) -
           IFNULL(SUM(CASE WHEN ve.entry_type = 'credit' THEN ve.amount ELSE 0 END),0) AS net_transaction_amount
         FROM ledgers l
         JOIN ledger_groups lg ON l.group_id = lg.id
         LEFT JOIN voucher_entries ve ON ve.ledger_id = l.id
         WHERE l.company_id = ?
         GROUP BY lg.name, lg.nature`,
        [company.id]
      );

      rows.forEach(r => {
        r.total = Number(r.total_opening_balance) + Number(r.net_transaction_amount);
        allBalanceGroups.add(r.group_name);
      });

      balanceRowsMap[company.id] = rows;
    }

    // --- Trading Account ---
    for (const company of companies) {
      const [sales] = await connection.query(
        `SELECT SUM(total) AS total FROM sales_vouchers WHERE company_id = ?`,
        [company.id]
      );
      const [purchases] = await connection.query(
        `SELECT SUM(total) AS total FROM purchase_vouchers WHERE company_id = ?`,
        [company.id]
      );
      tradingRowsMap[company.id] = {
        sales: sales[0].total || 0,
        purchases: purchases[0].total || 0
      };
    }

    // --- Profit & Loss: Heads ---
    const pl_heads = [
      { key: "grossProfit", label: "By Gross Profit" },
      { key: "auditFee", label: "To Audit Fee" },
      { key: "accountancyCharges", label: "To Accountancy Charges" },
      { key: "bankCharges", label: "To Bank Charges" },
    ];

    for (const company of companies) {
      let plData = {};
      const grossProfit = (tradingRowsMap[company.id]?.sales || 0) - (tradingRowsMap[company.id]?.purchases || 0);

      const [[auditFee]] = await connection.query(
        `SELECT SUM(ve.amount) as total
         FROM voucher_entries ve
         JOIN ledgers l ON ve.ledger_id = l.id
         WHERE l.company_id = ? AND l.name LIKE '%Audit Fee%'`,
        [company.id]
      );

      const [[accountancyCharges]] = await connection.query(
        `SELECT SUM(ve.amount) as total
         FROM voucher_entries ve
         JOIN ledgers l ON ve.ledger_id = l.id
         WHERE l.company_id = ? AND l.name LIKE '%Accountancy%'`,
        [company.id]
      );

      const [[bankCharges]] = await connection.query(
        `SELECT SUM(ve.amount) as total
         FROM voucher_entries ve
         JOIN ledgers l ON ve.ledger_id = l.id
         WHERE l.company_id = ? AND l.name LIKE '%Bank Charges%'`,
        [company.id]
      );

      plData.grossProfit = grossProfit;
      plData.auditFee = auditFee?.total || 0;
      plData.accountancyCharges = accountancyCharges?.total || 0;
      plData.bankCharges = bankCharges?.total || 0;

      plRowsMap[company.id] = plData;
      Object.keys(plData).forEach(k => allPAndLHeads.add(k));
    }

    // --- Format for frontend ---

    const balanceRows = Array.from(allBalanceGroups).map(group => {
      let nature;
      const companyTotals = {};
      companies.forEach(company => {
        const grp = (balanceRowsMap[company.id] || []).find(r => r.group_name === group);
        if (grp) nature = grp.nature;
        companyTotals[company.id] = grp ? Number(grp.total) : 0;
      });
      return { group_name: group, nature, companyTotals };
    });

    const tradingRows = [
      { name: "Sales", companyTotals: {}, key: "sales" },
      { name: "Purchases", companyTotals: {}, key: "purchases" },
      { name: "Gross Profit", companyTotals: {}, key: "grossProfit" },
    ];
    companies.forEach(company => {
      const ta = tradingRowsMap[company.id] || { sales: 0, purchases: 0 };
      tradingRows[0].companyTotals[company.id] = ta.sales;
      tradingRows[1].companyTotals[company.id] = ta.purchases;
      tradingRows[2].companyTotals[company.id] = ta.sales - ta.purchases;
    });

    const plRows = pl_heads.map(head => ({
      label: head.label,
      key: head.key,
      companyTotals: Object.fromEntries(
        companies.map(c => [c.id, plRowsMap[c.id]?.[head.key] || 0])
      )
    }));

    connection.release();

    res.json({
      companies,
      balanceRows,
      tradingRows,
      plRows
    });

  } catch (err) {
    connection.release();
    res.status(500).json({ message: err.message });
  }
});

router.get('/employee-financial-report-consolidated', async (req, res) => {
  const employee_id = req.query.employee_id;
  if (!employee_id) return res.status(400).json({ message: "Missing employee_id" });

  const connection = await db.getConnection();
  try {
    const [companies] = await connection.query(
      `SELECT id, name FROM tbcompanies WHERE employee_id = ?`,
      [employee_id]
    );

    // Generic helper for ledger groups
    async function getSectionData(companyId, ledgerNameLike) {
      const [rows] = await connection.query(
        `SELECT l.name, 
          SUM(l.opening_balance) AS total_opening_balance,
          IFNULL(SUM(CASE WHEN ve.entry_type = 'debit' THEN ve.amount ELSE 0 END),0) -
          IFNULL(SUM(CASE WHEN ve.entry_type = 'credit' THEN ve.amount ELSE 0 END),0) AS net_transaction_amount
         FROM ledgers l
         LEFT JOIN voucher_entries ve ON ve.ledger_id = l.id
         WHERE l.company_id = ? AND l.name LIKE ?
         GROUP BY l.name`,
        [companyId, ledgerNameLike]
      );

      return rows.map(r => ({
        name: r.name,
        amount: Number(r.total_opening_balance) + Number(r.net_transaction_amount)
      }));
    }

    const capitalRowsMap = {};
    for (const c of companies) {
      capitalRowsMap[c.id] = await getSectionData(c.id, '%Capital%');
    }

    const creditorsRowsMap = {};
    for (const c of companies) {
      creditorsRowsMap[c.id] = await getSectionData(c.id, '%Creditor%');
    }

    const payablesRowsMap = {};
    for (const c of companies) {
      payablesRowsMap[c.id] = await getSectionData(c.id, '%Payable%');
    }

    const cashBankRowsMap = {};
    for (const c of companies) {
      cashBankRowsMap[c.id] = await getSectionData(c.id, '%Cash%');
    }

    const debtorsRowsMap = {};
    for (const c of companies) {
      debtorsRowsMap[c.id] = await getSectionData(c.id, '%Debtor%');
    }

    const loansRowsMap = {};
    for (const c of companies) {
      loansRowsMap[c.id] = await getSectionData(c.id, '%Loan%');
    }

    connection.release();

    res.json({
      companies,
      capitalAccounts: capitalRowsMap,
      sundryCreditors: creditorsRowsMap,
      sundryPayables: payablesRowsMap,
      cashBankBalances: cashBankRowsMap,
      sundryDebtors: debtorsRowsMap,
      loansAdvances: loansRowsMap
    });

  } catch (err) {
    connection.release();
    res.status(500).json({ message: err.message });
  }
});

// GET /api/consolidated-balance-sheet - For consolidated balance sheet view (all employee's companies)
router.get('/consolidated-balance-sheet', async (req, res) => {
  const employee_id = req.query.employee_id;
  if (!employee_id) return res.status(400).json({ message: "Missing employee_id" });

  const connection = await db.getConnection();
  try {
    // Get all companies assigned to this employee
    const [companies] = await connection.query(
      `SELECT id, name FROM tbcompanies WHERE employee_id = ?`,
      [employee_id]
    );

    if (companies.length === 0) {
      connection.release();
      return res.json({ companies: [], ledgers: [], ledgerGroups: [], debitCreditData: {}, profitLossData: {} });
    }

    const companyIds = companies.map(c => c.id);
    const placeholders = companyIds.map(() => '?').join(',');

    // Fetch all ledger groups for all companies
    const [ledgerGroups] = await connection.query(
      `SELECT id, name, type, parent, company_id 
       FROM ledger_groups 
       WHERE company_id IN (${placeholders})`,
      companyIds
    );

    // Fetch all ledgers for all companies with company name
    const [ledgers] = await connection.query(
      `SELECT 
        l.id, 
        l.name, 
        l.group_id AS groupId,
        CAST(l.opening_balance AS DECIMAL(15,2)) AS openingBalance,
        l.balance_type AS balanceType,
        g.name AS groupName,
        g.type AS groupType,
        l.company_id AS companyId,
        c.name AS companyName
       FROM ledgers l
       LEFT JOIN ledger_groups g ON l.group_id = g.id
       LEFT JOIN tbcompanies c ON l.company_id = c.id
       WHERE l.company_id IN (${placeholders})
       ORDER BY l.company_id, g.type, g.name, l.name`,
      companyIds
    );

    // Fetch debit/credit data for all ledgers across all companies
    const ledgerIds = ledgers.map(l => l.id);
    let debitCreditData = {};

    if (ledgerIds.length > 0) {
      const ledgerPlaceholders = ledgerIds.map(() => '?').join(',');
      const [dcRows] = await connection.query(
        `SELECT 
          ledger_id,
          SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) AS debit,
          SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) AS credit
         FROM voucher_entries
         WHERE ledger_id IN (${ledgerPlaceholders})
         GROUP BY ledger_id`,
        ledgerIds
      );

      // Map debitCreditData with companyId_ledgerId as key
      dcRows.forEach(row => {
        const ledger = ledgers.find(l => l.id === row.ledger_id);
        if (ledger) {
          const key = `${ledger.companyId}_${row.ledger_id}`;
          debitCreditData[key] = {
            debit: Number(row.debit) || 0,
            credit: Number(row.credit) || 0
          };
        }
      });
    }

    // Fetch P&L data for each company
    const profitLossData = {};
    for (const company of companies) {
      // Get net profit/loss from localStorage values (stored in voucher_entries narration)
      const [transferredEntries] = await connection.query(
        `SELECT narration FROM voucher_entries 
         WHERE (narration LIKE 'PROFIT_TR:%' OR narration LIKE 'LOSS_TR:%')
         AND voucher_id IN (SELECT id FROM voucher_main WHERE company_id = ?)`,
        [company.id]
      );

      let transferredProfit = 0;
      let transferredLoss = 0;
      transferredEntries.forEach(entry => {
        if (entry.narration.startsWith('PROFIT_TR:')) {
          transferredProfit = Math.max(transferredProfit, parseFloat(entry.narration.split(':')[1]) || 0);
        } else if (entry.narration.startsWith('LOSS_TR:')) {
          transferredLoss = Math.max(transferredLoss, parseFloat(entry.narration.split(':')[1]) || 0);
        }
      });

      // Calculate net profit/loss from sales and purchases
      const [[salesResult]] = await connection.query(
        `SELECT COALESCE(SUM(total), 0) AS total FROM sales_vouchers WHERE company_id = ?`,
        [company.id]
      );
      const [[purchasesResult]] = await connection.query(
        `SELECT COALESCE(SUM(total), 0) AS total FROM purchase_vouchers WHERE company_id = ?`,
        [company.id]
      );

      // Get expenses from indirect expenses group
      const [[expensesResult]] = await connection.query(
        `SELECT COALESCE(SUM(ve.amount), 0) AS total
         FROM voucher_entries ve
         JOIN ledgers l ON ve.ledger_id = l.id
         JOIN ledger_groups g ON l.group_id = g.id
         WHERE l.company_id = ? 
         AND (g.id = -11 OR g.parent = -11 OR g.name LIKE '%Indirect Expenses%')
         AND ve.entry_type = 'debit'`,
        [company.id]
      );

      const sales = Number(salesResult?.total) || 0;
      const purchases = Number(purchasesResult?.total) || 0;
      const expenses = Number(expensesResult?.total) || 0;
      const grossProfit = sales - purchases;
      const netPL = grossProfit - expenses;

      profitLossData[company.id] = {
        netProfit: netPL > 0 ? netPL : 0,
        netLoss: netPL < 0 ? Math.abs(netPL) : 0,
        transferredProfit,
        transferredLoss
      };
    }

    // Fetch Sales and Purchase data for each company
    const salesData = {};
    const purchaseData = {};
    for (const company of companies) {
      const [[salesResult]] = await connection.query(
        `SELECT COALESCE(SUM(total), 0) AS total FROM sales_vouchers WHERE company_id = ?`,
        [company.id]
      );
      const [[purchasesResult]] = await connection.query(
        `SELECT COALESCE(SUM(total), 0) AS total FROM purchase_vouchers WHERE company_id = ?`,
        [company.id]
      );
      salesData[company.id] = Number(salesResult?.total) || 0;
      purchaseData[company.id] = Number(purchasesResult?.total) || 0;
    }

    connection.release();

    res.json({
      companies,
      ledgers,
      ledgerGroups,
      debitCreditData,
      profitLossData,
      salesData,
      purchaseData
    });

  } catch (err) {
    connection.release();
    console.error("Consolidated Balance Sheet Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
