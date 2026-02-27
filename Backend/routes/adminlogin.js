const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');

// ✅ Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user - checking tbadmin (super admin)
    const [rows] = await db.query('SELECT * FROM tbadmin WHERE email = ?', [email]);

    // If not found in tbadmin, check tbCA
    let user = rows[0];
    let role = 'super_admin';

    if (!user) {
      const [caRows] = await db.query('SELECT * FROM tbCA WHERE email = ?', [email]);
      if (caRows.length > 0) {
        user = caRows[0];
        role = 'ca_admin';
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password || user.fdpassword);
    if (!isMatch) {
      if (password !== (user.password || user.fdpassword)) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    // Update last login time for CA
    if (role === 'ca_admin') {
      await db.query('UPDATE tbCA SET fdlast_login = NOW() WHERE fdSiNo = ?', [user.fdSiNo]);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id || user.fdSiNo, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id || user.fdSiNo,
        email: user.email,
        name: user.fdname || 'Admin',
        role
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Get Current Admin Profile
router.get('/me', authMiddleware, async (req, res) => {
  try {

    console.log('hit')
    const { id, role } = req.user;
    let user;

    if (role === 'super_admin') {
      const [rows] = await db.query('SELECT id, email, created_at FROM tbadmin WHERE id = ?', [id]);
      user = rows[0];
    } else {
      const [rows] = await db.query('SELECT fdSiNo as id, fdname as name, fdphone as phone, email, fdstatus as status FROM tbCA WHERE fdSiNo = ?', [id]);
      user = rows[0];
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: { ...user, role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Update Profile
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user;
    const { name, phone, email, password } = req.body;

    let updateQuery;
    let params;

    if (role === 'super_admin') {
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateQuery = 'UPDATE tbadmin SET email = ?, password = ? WHERE id = ?';
        params = [email, hashedPassword, id];
      } else {
        updateQuery = 'UPDATE tbadmin SET email = ? WHERE id = ?';
        params = [email, id];
      }
    } else {
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateQuery = 'UPDATE tbCA SET fdname = ?, fdphone = ?, email = ?, fdpassword = ? WHERE fdSiNo = ?';
        params = [name, phone, email, hashedPassword, id];
      } else {
        updateQuery = 'UPDATE tbCA SET fdname = ?, fdphone = ?, email = ? WHERE fdSiNo = ?';
        params = [name, phone, email, id];
      }
    }

    await db.query(updateQuery, params);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Admin Logout
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});

// ✅ Admin Dashboard Stats
// ✅ Admin Dashboard Stats
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user;

    let totalCA, totalEmployees, totalCompanies, recentCompanies;

    if (role === 'super_admin') {
      // Global stats for Super Admin
      [[{ totalCA }]] = await db.query('SELECT COUNT(*) as totalCA FROM tbCA');
      [[{ totalEmployees }]] = await db.query('SELECT COUNT(*) as totalEmployees FROM tbemployees');
      [[{ totalCompanies }]] = await db.query('SELECT COUNT(*) as totalCompanies FROM tbcompanies');

      [recentCompanies] = await db.query(`
        SELECT c.name, c.created_at, e.fdname as owner
        FROM tbcompanies c
        LEFT JOIN tbCA e ON c.fdAccountantName = e.fdname
        ORDER BY c.created_at DESC
        LIMIT 5
      `);
    } else {
      // Stats for specific CA Admin
      const [[caUser]] = await db.query('SELECT fdname FROM tbCA WHERE fdSiNo = ?', [id]);
      const caName = caUser ? caUser.fdname : null;

      totalCA = 1; // Only themselves

      // Companies assigned to this CA
      [[{ totalCompanies }]] = await db.query('SELECT COUNT(*) as totalCompanies FROM tbcompanies WHERE fdAccountantName = ?', [caName]);

      // Employees associated with these companies (optional lookup)
      [[{ totalEmployees }]] = await db.query(`
        SELECT COUNT(DISTINCT employee_id) as totalEmployees 
        FROM tbcompanies 
        WHERE fdAccountantName = ? AND employee_id IS NOT NULL`,
        [caName]);

      [recentCompanies] = await db.query(`
        SELECT c.name, c.created_at, ? as owner
        FROM tbcompanies c
        WHERE c.fdAccountantName = ?
        ORDER BY c.created_at DESC
        LIMIT 5
      `, [caName, caName]);
    }

    res.json({
      stats: {
        totalCA,
        totalEmployees,
        totalCompanies,
        monthlyRevenue: 125000, // Mocked
        failedPayments: 3       // Mocked
      },
      recentActivity: recentCompanies.map(c => ({
        type: 'company_created',
        title: 'New company registered',
        time: c.created_at,
        user: c.name,
        owner: c.owner
      }))
    });
  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
