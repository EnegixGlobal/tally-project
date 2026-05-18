const express = require('express');
const router = express.Router();
const db = require('../db');

// POST add attribute
router.post('/', async (req, res) => {
    const { stock_item_id, attribute_id, attribute_value } = req.body;
    if (!stock_item_id || !attribute_id || !attribute_value) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const connection = await db.getConnection();
    try {
        const [result] = await connection.execute(
            'INSERT INTO stock_item_attributes (stock_item_id, attribute_id, attribute_value) VALUES (?, ?, ?)',
            [stock_item_id, attribute_id, attribute_value]
        );
        res.json({ success: true, id: result.insertId, message: "Attribute added successfully" });
    } catch (err) {
        console.error("🔥 Error adding attribute:", err);
        res.status(500).json({ success: false, message: "Error adding attribute" });
    } finally {
        connection.release();
    }
});

// DELETE attribute
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.execute('DELETE FROM stock_item_attributes WHERE id = ?', [id]);
        res.json({ success: true, message: "Attribute deleted successfully" });
    } catch (err) {
        console.error("🔥 Error deleting attribute:", err);
        res.status(500).json({ success: false, message: "Error deleting attribute" });
    } finally {
        connection.release();
    }
});

// PUT update attribute value
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { attribute_value } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.execute(
            'UPDATE stock_item_attributes SET attribute_value = ? WHERE id = ?',
            [attribute_value, id]
        );
        res.json({ success: true, message: "Attribute value updated successfully" });
    } catch (err) {
        console.error("🔥 Error updating attribute value:", err);
        res.status(500).json({ success: false, message: "Error updating attribute value" });
    } finally {
        connection.release();
    }
});

module.exports = router;
