const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all attributes
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM stock_attributes ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("🔥 Error fetching stock attributes:", err);
        res.status(500).json({ success: false, message: "Error fetching stock attributes" });
    }
});

// POST add attribute
router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: "Name is required" });
    }

    const connection = await db.getConnection();
    try {
        const [result] = await connection.execute(
            'INSERT INTO stock_attributes (name) VALUES (?)',
            [name]
        );
        res.json({ success: true, id: result.insertId, message: "Attribute added successfully" });
    } catch (err) {
        console.error("🔥 Error adding stock attribute:", err);
        res.status(500).json({ success: false, message: "Error adding stock attribute" });
    } finally {
        connection.release();
    }
});

// DELETE attribute
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.execute('DELETE FROM stock_attributes WHERE id = ?', [id]);
        res.json({ success: true, message: "Attribute deleted successfully" });
    } catch (err) {
        console.error("🔥 Error deleting stock attribute:", err);
        res.status(500).json({ success: false, message: "Error deleting stock attribute" });
    } finally {
        connection.release();
    }
});

module.exports = router;
