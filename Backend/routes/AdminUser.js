const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// ✅ Get all users (Role-aware)
router.get('/', async (req, res) => {

  try {
    const { id, role } = req.user;
    let users;

    if (role === 'super_admin') {
      // Super Admin sees all CAs
      [users] = await db.query(`
        SELECT
          fdSiNo AS id,
          fdname AS name,
          fdphone AS phone,
          email,
          fdstatus AS status,
          fdlast_login AS last_login
        FROM tbCA
      `);
    } else if (role === 'ca_admin') {
      // CA sees their own employees
      [users] = await db.query(`
        SELECT
          id,
          name,
          phone,
          email,
          'active' AS status, 
          created_at AS last_login 
        FROM tbCAEmployees
        WHERE ca_id = ?
      `, [id]);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Ensure dates are valid
    const formattedUsers = users.map(u => ({
      ...u,
      lastLogin: u.last_login ? new Date(u.last_login).toISOString() : null
    }));


    res.json(formattedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add new user (Role-aware)
router.post('/', async (req, res) => {
  try {
    const { id, role } = req.user;
    const { name, phone, email, password, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    if (role === 'super_admin') {
      const [result] = await db.query(`
        INSERT INTO tbCA (fdname, fdphone, email, fdpassword, fdstatus, fdlast_login)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [name, phone, email, hashedPassword, status || 'active', now]);

      res.status(201).json({ id: result.insertId, name, phone, email, status: status || 'active', lastLogin: now });
    } else if (role === 'ca_admin') {
      const [result] = await db.query(`
        INSERT INTO tbCAEmployees (ca_id, name, email, phone, password)
        VALUES (?, ?, ?, ?, ?)
      `, [id, name, email, phone, hashedPassword]);

      res.status(201).json({ id: result.insertId, name, phone, email, status: 'active', lastLogin: now });
    } else {
      res.status(403).json({ error: 'Unauthorized' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update user (Role-aware)
router.put('/:userId', async (req, res) => {
  const { role } = req.user;
  const { name, phone, email, password, status } = req.body;
  const userId = req.params.userId;

  try {
    if (role === 'super_admin') {
      let query, params;
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query = 'UPDATE tbCA SET fdname = ?, fdphone = ?, email = ?, fdpassword = ?, fdstatus = ? WHERE fdSiNo = ?';
        params = [name, phone, email, hashedPassword, status, userId];
      } else {
        query = 'UPDATE tbCA SET fdname = ?, fdphone = ?, email = ?, fdstatus = ? WHERE fdSiNo = ?';
        params = [name, phone, email, status, userId];
      }
      await db.query(query, params);
    } else if (role === 'ca_admin') {
      let query, params;
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query = 'UPDATE tbCAEmployees SET name = ?, phone = ?, email = ?, password = ? WHERE id = ? AND ca_id = ?';
        params = [name, phone, email, hashedPassword, userId, req.user.id];
      } else {
        query = 'UPDATE tbCAEmployees SET name = ?, phone = ?, email = ? WHERE id = ? AND ca_id = ?';
        params = [name, phone, email, userId, req.user.id];
      }
      await db.query(query, params);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ id: userId, name, phone, email, status, message: 'User updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Change user status (Role-aware)
router.patch('/:userId/status', async (req, res) => {
  try {
    const { role } = req.user;
    const { status } = req.body;
    const userId = req.params.userId;

    if (!['active', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let result;
    if (role === 'super_admin') {
      [result] = await db.query('UPDATE tbCA SET fdstatus = ? WHERE fdSiNo = ?', [status, userId]);
    } else if (role === 'ca_admin') {
      [result] = await db.query('UPDATE tbCAEmployees SET status = ? WHERE id = ? AND ca_id = ?', [status, userId, req.user.id]);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Status updated', id: userId, status });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete user (Role-aware)
router.delete('/:userId', async (req, res) => {
  try {
    const { id, role } = req.user;
    const userId = parseInt(req.params.userId, 10);
    let result;

    if (role === 'super_admin') {
      [result] = await db.query('DELETE FROM tbCA WHERE fdSiNo = ?', [userId]);
    } else if (role === 'ca_admin') {
      [result] = await db.query('DELETE FROM tbCAEmployees WHERE id = ? AND ca_id = ?', [userId, id]);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted', id: userId });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
