const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// GET all CAs
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT id, name, email, phone, firm_name, registration_number, designation, membership_number, pan_number, udin, status, created_at, updated_at FROM ca_users ORDER BY id DESC';
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (error) {
        console.error('Server error fetching CAs:', error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ error: 'Database table ca_users does not exist. Please run the SQL command to create it.' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// POST a new CA
router.post('/', async (req, res) => {
    const { name, email, phone, firmName, registrationNumber, designation, membershipNumber, panNumber, udin, status, password } = req.body;

    if (!name || !email || !phone || !firmName || !registrationNumber || !password) {
        return res.status(400).json({ error: 'Please provide all mandatory fields' });
    }

    try {
        let hashedPassword = password;
        if (typeof bcrypt !== 'undefined' && bcrypt.hashSync) {
            hashedPassword = bcrypt.hashSync(password, 10);
        }

        const query = `
            INSERT INTO ca_users 
            (name, email, phone, firm_name, registration_number, designation, membership_number, pan_number, udin, password, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [results] = await db.query(query, [name, email, phone, firmName, registrationNumber, designation || null, membershipNumber || null, panNumber || null, udin || null, hashedPassword, status || 'active']);
        res.status(201).json({ message: 'CA created successfully', id: results.insertId });
    } catch (error) {
        console.error('Server error creating CA:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email or Registration Number already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update CA
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, firmName, registrationNumber, designation, membershipNumber, panNumber, udin, status, password } = req.body;

    if (!name || !email || !phone || !firmName || !registrationNumber) {
        return res.status(400).json({ error: 'Please provide all mandatory fields' });
    }

    try {
        let query = `
            UPDATE ca_users 
            SET name = ?, email = ?, phone = ?, firm_name = ?, registration_number = ?, designation = ?, membership_number = ?, pan_number = ?, udin = ?, status = ?
        `;
        const queryParams = [name, email, phone, firmName, registrationNumber, designation || null, membershipNumber || null, panNumber || null, udin || null, status || 'active'];

        if (password) {
            let hashedPassword = password;
            if (typeof bcrypt !== 'undefined' && bcrypt.hashSync) {
                hashedPassword = bcrypt.hashSync(password, 10);
            }
            query += `, password = ?`;
            queryParams.push(hashedPassword);
        }

        query += ` WHERE id = ?`;
        queryParams.push(id);
        
        const [results] = await db.query(query, queryParams);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'CA not found' });
        }
        
        res.status(200).json({ message: 'CA updated successfully' });
    } catch (error) {
        console.error('Server error updating CA:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email or Registration Number already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE a CA
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM ca_users WHERE id = ?';
        const [results] = await db.query(query, [id]);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'CA not found' });
        }
        
        res.status(200).json({ message: 'CA deleted successfully' });
    } catch (error) {
        console.error('Server error deleting CA:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
