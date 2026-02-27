const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all traders (employees from tbemployees) with their details and company counts
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'super_admin') {
            return res.status(403).json({ error: 'Unauthorized. Super Admin only.' });
        }

        const [traders] = await db.query(`
      SELECT 
        e.id, 
        e.firstName, 
        e.lastName, 
        e.email, 
        e.phoneNumber as phone, 
        e.pan, 
        e.userLimit, 
        e.created_at,
        (SELECT COUNT(*) FROM tbcompanies WHERE employee_id = e.id) as company_count
      FROM tbemployees e
      ORDER BY e.created_at DESC
    `);

        res.json(traders);
    } catch (err) {
        console.error('Error fetching traders:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update trader limit
router.patch('/:id/limit', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { userLimit } = req.body;

    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Unauthorized.' });
        }

        await db.query('UPDATE tbemployees SET userLimit = ? WHERE id = ?', [userLimit, id]);
        res.json({ message: 'User limit updated successfully', id, userLimit });
    } catch (err) {
        console.error('Error updating trader limit:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete trader
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Unauthorized.' });
        }
        await db.query('DELETE FROM tbemployees WHERE id = ?', [id]);
        res.json({ message: 'Trader deleted successfully', id });
    } catch (err) {
        console.error('Error deleting trader:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
