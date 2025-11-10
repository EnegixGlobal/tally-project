const express = require('express');
const router = express.Router();
const db = require('../db'); // Promise-based MySQL pool
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();

    // Define login sources
    const roleTables = [
      {
        table: 'tbemployees',
        role: 'employee',
        supplier: 'employee',
        passwordField: 'password',
        idField: 'id',
        nameField: (u) => `${u.firstName} ${u.lastName}`,
      },
      {
        table: 'tbca',
        role: 'ca',
        supplier: 'ca',

        passwordField: 'fdpassword',
        idField: 'fdSiNo',
        nameField: (u) => u.fdname,
      },
      {
        table: 'tbcaemployees',
        role: 'ca_employee',
        supplier: 'ca_employee',
        passwordField: 'password',
        idField: 'id',
        nameField: (u) => u.name,
      }
    ];



    for (const { table, role, supplier, passwordField, idField, nameField } of roleTables) {
      const [rows] = await db.query(
        `SELECT * FROM ${table} WHERE email = ?`,
        [emailTrimmed]
      );
      if (!rows.length) continue;

      const user = rows[0];
    
      if (!user[passwordField]) {
        return res.status(500).json({ message: 'User password not set' });
      }

      const match = await bcrypt.compare(passwordTrimmed, user[passwordField]);
      if (!match) return res.status(401).json({ message: 'Invalid email or password' });

      let employeeId = null;
      let companyRow = null;

      

      if (role === 'employee') {
        // It's an employee; use own id
        employeeId = user[idField];

        // Optionally, get company for info (if needed)
        const [[company]] = await db.query('SELECT * FROM tbcompanies WHERE employee_id = ?', [user[idField]]);
        companyRow = company || null;
       

      } else if (role === 'ca') {
        // It's a CA; get their company by fdAccountantName, fetch its employee_id
        const [[company]] = await db.query(
          'SELECT * FROM tbcompanies WHERE fdAccountantName = ?',
          [user['fdname']]
        );
        companyRow = company || null;
        if (companyRow && companyRow.employee_id) {
          employeeId = companyRow.employee_id;
        }
        // Optionally, fallback to null if not mapped or multiple companies -- adapt as needed

      } else if (role === 'ca_employee') {
        // It's a CA Employee; get their ca_id, then company's employee_id via fdAccountantName
        const caId = user['ca_id'];

        // Find company where fdAccountantName = ca_id (the main CA for this employee's assignments)
        const [[company]] = await db.query(
          'SELECT * FROM tbcompanies WHERE fdAccountantName = ?',
          [caId]
        );
        companyRow = company || null;
        if (companyRow && companyRow.employee_id) {
          employeeId = companyRow.employee_id;
        }
      }

      const companyId = companyRow?.id || null;
      const hasCompany = !!companyRow;
      const userid = "employee";

      const token = jwt.sign(
        { id: user[idField], role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log()

      return res.json({
        success: true,
        token,
        role,
        supplier,
        userid,
        companyId,
        hasCompany,
        companyInfo: companyRow || null,
        employee_id: employeeId, // Always per your mapping
        user: {
          id: user[idField],
          name: nameField(user),
          email: user.email,
        }
      });
    }

    // No match found
    return res.status(401).json({ message: 'Invalid email or password' });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
