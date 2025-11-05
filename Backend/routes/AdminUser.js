const express = require('express');
const router = express.Router();
const db = require('../db'); // Promise-based MySQL pool
const bcrypt = require('bcryptjs');

// ✅ Get all admin users

router.get('/', async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT
        fdSiNo AS id,
        fdname AS name,
        fdphone AS phone,
        email,
        fdstatus AS status,
        fdlast_login AS last_login
      FROM tbCA
    `);

    // Ensure last_login is either a valid ISO string or null
    const formattedUsers = users.map(u => ({
      ...u,
      last_login: u.last_login ? new Date(u.last_login).toISOString() : null
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ Add new admin user
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, password, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    const query = `
      INSERT INTO tbCA (fdname, fdphone, email, fdpassword, fdstatus, fdlast_login)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      name,
      phone,
      email,
      hashedPassword,
      status || 'active',
      now
    ]);

    // Send response after successful insertion
    res.status(201).json({
      id: result.insertId,
      name,
      phone,
      email,
      status: status || 'active',
      last_login: now
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});




router.put('/:id', async (req, res) => {
  const { name, phone, email, password, status } = req.body;
  const userId = req.params.id;

  try {
    let hashedPassword = password;

    // Only hash if password is provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const query = `
      UPDATE tbCA 
      SET fdname = ?, fdphone = ?, email = ?, fdpassword = ?, fdstatus = ?
      WHERE fdSiNo = ?
    `;

    const [result] = await db.query(query, [name, phone, email, hashedPassword, status, userId]);

    res.json({ id: userId, name, phone, email, status, message: 'Admin user updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ Delete admin user
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const [result] = await db.query('DELETE FROM tbCA WHERE fdSiNo = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Admin user deleted', id: userId });
  } catch (err) {
    console.error('Error deleting admin user:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update last login
// Assuming Express + MySQL
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const userId = parseInt(req.params.id, 10);

    console.log('PATCH request received:', userId, { status });

    const [result] = await db.query(
      'UPDATE tbCA SET fdstatus = ? WHERE fdSiNo = ?',
      [status, userId]
    );

    console.log('DB update result:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Status updated', id: userId, status });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: err.message });
  }
});




module.exports = router;