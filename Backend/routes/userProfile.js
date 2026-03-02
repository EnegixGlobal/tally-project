const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

// Get user profile
router.get('/my-profile', authMiddleware, async (req, res) => {
    try {
        const { id, role } = req.user;

        let sql = '';
        let params = [id];

        if (role === 'ca') {
            sql = 'SELECT fdSiNo as id, fdname as firstName, email, fdphoneNumber as phoneNumber, fdpan as pan, created_at FROM tbca WHERE fdSiNo = ?';
        } else if (role === 'ca_employee') {
            sql = 'SELECT id, name as firstName, email, phone as phoneNumber, adhar, created_at FROM tbcaemployees WHERE id = ?';
        } else {
            // Default to tbemployees (trader/employee)
            sql = 'SELECT id, firstName, lastName, email, phoneNumber, pan, userLimit, created_at FROM tbemployees WHERE id = ?';
        }

        const [rows] = await db.query(sql, params);
        if (rows.length === 0) return res.status(404).json({ message: 'Profile not found' });

        res.json({ success: true, profile: rows[0] });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update user profile
router.post('/update-profile', authMiddleware, async (req, res) => {
    try {
        const { id, role } = req.user;
        const { firstName, lastName, phoneNumber, pan } = req.body;

        let sql = '';
        let params = [];

        if (role === 'ca') {
            sql = 'UPDATE tbca SET fdname = ?, fdphoneNumber = ? WHERE fdSiNo = ?';
            params = [firstName, phoneNumber, id];
        } else if (role === 'ca_employee') {
            sql = 'UPDATE tbcaemployees SET name = ?, phone = ? WHERE id = ?';
            params = [firstName, phoneNumber, id];
        } else {
            sql = 'UPDATE tbemployees SET firstName = ?, lastName = ?, phoneNumber = ? WHERE id = ?';
            params = [firstName, lastName, phoneNumber, id];
        }

        await db.query(sql, params);
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
