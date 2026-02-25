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
