const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // use bcryptjs or bcrypt
const pool = require('../db'); // your mysql2 connection pool

// Helper to get full name from employee record
async function getUserFullName(employeeId) {
  const [[employee]] = await pool.query('SELECT firstName, lastName FROM tbemployees WHERE id = ?', [employeeId]);
  if (!employee) return '';
  return `${employee.firstName} ${employee.lastName}`.trim();
}

// Helper: Get roles and permissions for a user
async function getUserRolesAndPermissions(userId) {
  // Get roles linked to this user
  const [roles] = await pool.query(`
    SELECT r.role_id, r.role_name
    FROM tbUserRoles ur
    JOIN tbRoles r ON ur.role_id = r.role_id
    WHERE ur.user_id = ?
  `, [userId]);

  // For each role, get privileges
  let permissionsSet = new Set();
  for (const role of roles) {
    const [privs] = await pool.query(`
      SELECT p.permission_name
      FROM tbRolePermissions rp
      JOIN tbPermissions p ON rp.permission_id = p.permission_id 
      WHERE rp.role_id = ?
    `, [role.role_id]);
    privs.forEach(p => permissionsSet.add(p.permission_name));
  }

  return {
    roles: roles.map(r => r.role_name),
    permissions: Array.from(permissionsSet),
    primaryRole: roles.length > 0 ? roles[0].role_name : 'No Role'
  };
}

// GET /api/users
// Supports query params: search, status, role, pagination (optional)
router.get('/users', async (req, res) => {
  try {
    const { search = '', status = 'all', role = 'all', creatorEmployeeId } = req.query;

    if (!creatorEmployeeId) {
      return res.status(400).json({ success: false, error: 'creatorEmployeeId is required' });
    }

    let sql = `
      SELECT 
        u.id, 
        u.username,   -- ✅ from tbUsers
        u.email, 
        u.phone, 
        u.department, 
        u.status, 
        u.last_login, 
        u.created_at,
        r.role_name
      FROM tbUsers u
      LEFT JOIN tbUserRoles ur ON u.id = ur.user_id
      LEFT JOIN tbRoles r ON ur.role_id = r.role_id
      WHERE u.employee_id = ?
    `;

    const params = [creatorEmployeeId];

    if (search.trim() !== '') {
      sql += ` AND (u.username LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status !== 'all') {
      sql += ` AND u.status = ?`;
      params.push(status);
    }

    if (role !== 'all') {
      sql += ` AND r.role_name = ?`;
      params.push(role);
    }

    sql += ' ORDER BY u.created_at DESC';

    const [rows] = await pool.query(sql, params);

    // Aggregate users (fetch permissions if you want)
    const users = [];
    for (const row of rows) {
      const { roles, permissions, primaryRole } = await getUserRolesAndPermissions(row.id);
      users.push({
        id: row.id,
        name: row.username || row.email,  // ✅ userName from tbUsers
        email: row.email,
        phone: row.phone,
        department: row.department,
        status: row.status,
        lastLogin: row.last_login && row.last_login instanceof Date && !isNaN(row.last_login)
          ? row.last_login.toISOString().slice(0, 19).replace('T', ' ')
          : null,        
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString().slice(0, 10) : row.created_at,
              role: primaryRole,
        permissions
      });
    }

    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


// POST /api/users — Create new user
router.post('/users', async (req, res) => {
  try {
    const { creatorEmployeeId, companyId, name, email, phone, department, role, password } = req.body;

    if (!creatorEmployeeId || !companyId) {
      return res.status(400).json({ success: false, error: 'creatorEmployeeId and companyId are required' });
    }
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and role are required' });
    }

    // Check for existing user
    const [[existingUser]] = await pool.query('SELECT id FROM tbUsers WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get role_id by role name (and company, if needed)
    const [[roleRow]] = await pool.query(
      `SELECT role_id FROM tbRoles WHERE LOWER(role_name) = LOWER(?) LIMIT 1`,
      [role.trim()]
    );
    if (!roleRow) {
      return res.status(400).json({ success: false, error: `Invalid role specified: ${role}` });
    }

    // Insert user, INCLUDING role_id
    const [userResult] = await pool.query(
      `INSERT INTO tbUsers (employee_id, company_id, role_id, username, email, phone, department, password, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [creatorEmployeeId, companyId, roleRow.role_id, name, email, phone || '', department || '', passwordHash]
    );
    const userId = userResult.insertId;

    // (Optionally) add to tbUserRoles as well, or remove if not using
    await pool.query(
      'INSERT INTO tbUserRoles (user_id, role_id) VALUES (?, ?);',
      [userId, roleRow.role_id]
    );

    res.json({ success: true, message: 'User created', userId });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


// PUT /api/users/:id/suspend — Change user status to suspended
// router.put('/users/:id/suspend', async (req, res) => {
//   try {
//     const userId = req.params.id;

//     // Change user status to suspended
//     await pool.query(`UPDATE tbUsers SET status = 'suspended' WHERE id = ?`, [userId]);

//     res.json({ success: true, message: 'User suspended' });
//   } catch (err) {
//     console.error('Error suspending user:', err);
//     res.status(500).json({ success: false, error: 'Internal Server Error' });
//   }
// });

// DELETE /api/users/:id — Delete user entirely
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Remove roles assigned first
    await pool.query('DELETE FROM tbUserRoles WHERE user_id = ?', [userId]);

    // Delete user record
    await pool.query('DELETE FROM tbUsers WHERE id = ?', [userId]);

    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});
// GET /api/roles/names - fetch all role names
router.get('/roles/names', async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT role_name FROM tbRoles ORDER BY role_name');
    res.json({ success: true, roles: roles.map(r => r.role_name) });
  } catch (err) {
    console.error('Error fetching role names:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
