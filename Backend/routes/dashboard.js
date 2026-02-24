const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/dashboard-data', async (req, res) => {
  const { employee_id } = req.query;

  if (!employee_id) return res.status(400).json({ success: false, error: 'employee_id required' });

  try {
    const [[companyInfo]] = await db.query('SELECT * FROM tbcompanies WHERE employee_id = ?', [employee_id]);
    const [userLimitRows] = await db.query('SELECT userLimit FROM tbemployees WHERE id = ?', [employee_id]);
    const userLimit = userLimitRows && userLimitRows.length > 0 ? userLimitRows[0].userLimit : 1;
    const [companies] = await db.query(
      `SELECT c.*, 
       (SELECT COUNT(*) FROM tbusers u WHERE u.company_id = c.id) > 0 as isLocked 
       FROM tbcompanies c WHERE c.employee_id = ?`,
      [employee_id]
    );
    res.json({
      success: true,
      companyInfo: companyInfo || null,
      companies: companies || [],    // <--- return array!

      userLimit,
      //   ledgers,
      //   vouchers
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

  try {
    const connection = await db.getConnection();
    // Customize this query for your schema
    const [rows] = await connection.query(
      `SELECT id, name, employee_id, pan_number,
       (SELECT COUNT(*) FROM tbusers u WHERE u.company_id = tbcompanies.id) > 0 as isLocked
       FROM tbcompanies WHERE fdAccountantName = ?`,
      [caId]
    );
    connection.release();
    res.json({ companies: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;
