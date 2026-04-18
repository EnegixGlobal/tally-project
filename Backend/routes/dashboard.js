const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/dashboard-data', async (req, res) => {
  const { employee_id, company_id } = req.query;

  if (!employee_id) return res.status(400).json({ success: false, error: 'employee_id required' });

  try {
    let companyInfoQuery = 'SELECT * FROM tbcompanies WHERE employee_id = ?';
    let companiesQuery = `SELECT c.*, 
       (SELECT COUNT(*) FROM tbusers u WHERE u.company_id = c.id) > 0 as isLocked 
       FROM tbcompanies c WHERE c.employee_id = ?`;
    let queryParams = [employee_id];

    if (company_id) {
      companyInfoQuery += ' AND id = ?';
      companiesQuery += ' AND c.id = ?';
      queryParams.push(company_id);
    }

    const [[companyInfo]] = await db.query(companyInfoQuery, queryParams);
    const [userLimitRows] = await db.query('SELECT userLimit FROM tbemployees WHERE id = ?', [employee_id]);
    const userLimit = userLimitRows && userLimitRows.length > 0 ? userLimitRows[0].userLimit : 1;
    const [companies] = await db.query(companiesQuery, queryParams);

    // Fetch ledgers and vouchers for the specific company (using the first one found or the company_id provided)
    const activeCompanyId = company_id || (companyInfo ? companyInfo.id : null);
    let ledgers = [];
    let vouchers = [];
    let stats = {
      salesMonthly: 0,
      purchaseMonthly: 0,
      inputTaxMonthly: 0,
      outputTaxMonthly: 0
    };

    if (activeCompanyId) {
      const [ledgerRows] = await db.query('SELECT * FROM ledgers WHERE company_id = ?', [activeCompanyId]);
      const [voucherRows] = await db.query('SELECT * FROM voucher_main WHERE company_id = ?', [activeCompanyId]);
      ledgers = ledgerRows;
      vouchers = voucherRows;

      // Calculate stats based on financialYear
      const { financialYear } = req.query; // e.g. "2025-26" or ""

      let salesQuery = `
        SELECT 
          SUM(total) as totalSales,
          SUM(cgstTotal + sgstTotal + igstTotal) as totalOutputTax
        FROM sales_vouchers 
        WHERE company_id = ?
      `;
      let purchaseQuery = `
        SELECT 
          SUM(total) as totalPurchases,
          SUM(cgstTotal + sgstTotal + igstTotal) as totalInputTax
        FROM purchase_vouchers 
        WHERE company_id = ?
      `;
      let queryParams = [activeCompanyId];

      if (financialYear) {
        // Filter by financial year range
        const match = financialYear.match(/\d{4}/);
        const year = match ? parseInt(match[0], 10) : new Date().getFullYear();
        const startDate = `${year}-04-01`;
        const endDate = `${year + 1}-03-31`;

        salesQuery += ' AND date >= ? AND date <= ?';
        purchaseQuery += ' AND date >= ? AND date <= ?';
        queryParams.push(startDate, endDate);
      } else if (financialYear === undefined) {
        // Default: Current Month (original behavior)
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        salesQuery += ' AND MONTH(date) = ? AND YEAR(date) = ?';
        purchaseQuery += ' AND MONTH(date) = ? AND YEAR(date) = ?';
        queryParams.push(currentMonth, currentYear);
      } else {
        // financialYear === "" (Clear) -> All time, no more filters needed
      }

      const [salesStats] = await db.query(salesQuery, queryParams);
      const [purchaseStats] = await db.query(purchaseQuery, queryParams);

      stats = {
        salesMonthly: salesStats[0]?.totalSales || 0,
        purchaseMonthly: purchaseStats[0]?.totalPurchases || 0,
        outputTaxMonthly: salesStats[0]?.totalOutputTax || 0,
        inputTaxMonthly: purchaseStats[0]?.totalInputTax || 0
      };
    }

    res.json({
      success: true,
      companyInfo: companyInfo || null,
      companies: companies || [],
      userLimit,
      ledgers,
      vouchers,
      stats
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/companies-by-employee', async (req, res) => {
  const { employee_id } = req.query;


  if (!employee_id) {
    return res.status(400).json({ success: false, error: 'employee_id required' });
  }

  try {
    const [companies] = await db.query(
      `SELECT c.id, c.name, 
       (SELECT COUNT(*) FROM tbusers u WHERE u.company_id = c.id) > 0 as isLocked 
       FROM tbcompanies c WHERE c.employee_id = ?`,
      [employee_id]
    );

    res.json({ success: true, companies });
  } catch (err) {
    console.error('Error fetching companies by employee:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
// Assuming CA's ID is available as req.query.ca_id
router.get('/companies-by-ca', async (req, res) => {
  const caId = req.query.ca_id;
  if (!caId) return res.status(400).json({ message: 'Missing ca_id' });

  let connection;
  try {
    connection = await db.getConnection();

    // 1. Look up the CA's name using their ID (fdSiNo)
    const [caRows] = await connection.query('SELECT fdname FROM tbca WHERE fdSiNo = ?', [caId]);

    const caName = caRows.length > 0 ? caRows[0].fdname.trim() : null;

    // 2. Find companies linked to this CA (as accountant or owner)
    // We search by name (common for CAs) and also by caId as owner
    const [rows] = await connection.query(
      `SELECT id, name, employee_id, pan_number,
       (SELECT COUNT(*) FROM tbusers u WHERE u.company_id = tbcompanies.id) > 0 as isLocked
       FROM tbcompanies 
       WHERE (fdAccountantName = ?) OR (employee_id = ?)`,
      [caName, caId]
    );

    res.json({ companies: rows });
  } catch (err) {
    console.error('Error fetching companies by CA ID:', err);
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
});



module.exports = router;
