const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendMail } = require('../utils/mailer');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper: find user across known tables
async function findUserByEmail(email) {
  const emailTrim = email.trim();

  // Check tbadmin (super admin)
  let [rows] = await db.query('SELECT * FROM tbadmin WHERE email = ?', [emailTrim]);
  if (rows.length) return { table: 'tbadmin', user: rows[0], passwordField: 'password', idField: 'id' };

  // Check tbemployees
  [rows] = await db.query('SELECT * FROM tbemployees WHERE email = ?', [emailTrim]);
  if (rows.length) return { table: 'tbemployees', user: rows[0], passwordField: 'password', idField: 'id' };

  // Check tbca
  [rows] = await db.query('SELECT * FROM tbca WHERE email = ? OR fdname = ?', [emailTrim, emailTrim]);
  if (rows.length) return { table: 'tbca', user: rows[0], passwordField: 'fdpassword', idField: 'fdSiNo' };

  // Check tbcaemployees
  [rows] = await db.query('SELECT * FROM tbcaemployees WHERE email = ?', [emailTrim]);
  if (rows.length) return { table: 'tbcaemployees', user: rows[0], passwordField: 'password', idField: 'id' };

  // Check tbusers (company users)
  [rows] = await db.query('SELECT * FROM tbusers WHERE email = ? OR username = ?', [emailTrim, emailTrim]);
  if (rows.length) return { table: 'tbusers', user: rows[0], passwordField: 'password', idField: 'id' };

  return null;
}

// POST /forgot -> send 4-digit OTP if user exists
router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const found = await findUserByEmail(email);
    if (!found) return res.status(200).json({ message: 'If an account exists, a reset email has been sent' });

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = bcrypt.hashSync(otp, 10);

    const payload = {
      type: 'otp_token',
      table: found.table,
      id: found.user[found.idField],
      email: found.user.email || found.user.username || '',
      otpHash,
    };

    const otpToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

    const subject = 'Your Password Reset Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #6D30D4; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">We received a request to reset your password. Please use the following verification code to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #6D30D4; letter-spacing: 5px; padding: 10px 20px; background-color: #f4f0fc; border-radius: 8px;">${otp}</span>
        </div>
        <p style="font-size: 16px; color: #333;">This code is valid for <strong>15 minutes</strong>. For your security, please do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
        <p style="font-size: 14px; color: #888; text-align: center;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
    `;

    await sendMail({ to: payload.email || email, subject, html, text: `Your OTP is: ${otp}` });

    return res.json({ success: true, message: 'If an account exists, a reset email has been sent', otpToken });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /verify-otp -> verify 4-digit OTP
router.post('/verify-otp', async (req, res) => {
  const { otpToken, otp } = req.body;
  if (!otpToken || !otp) return res.status(400).json({ message: 'Token and OTP are required' });

  try {
    const decoded = jwt.verify(otpToken, JWT_SECRET);
    if (!decoded || decoded.type !== 'otp_token' || !decoded.otpHash) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const isValid = await bcrypt.compare(otp.trim(), decoded.otpHash);
    if (!isValid) return res.status(400).json({ message: 'Invalid OTP' });

    const resetPayload = {
      type: 'reset_token',
      table: decoded.table,
      id: decoded.id,
    };

    const resetToken = jwt.sign(resetPayload, JWT_SECRET, { expiresIn: '15m' });

    return res.json({ success: true, resetToken });
  } catch (err) {
    console.error('Verify OTP error:', err);
    if (err.name === 'TokenExpiredError') return res.status(400).json({ message: 'Token expired' });
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /reset -> accept token + newPassword
router.post('/reset', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: 'Token and newPassword are required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.table || !decoded.id || (decoded.type && decoded.type !== 'reset_token')) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const table = decoded.table;
    const id = decoded.id;

    const hashed = await bcrypt.hash(newPassword.trim(), 10);

    let passwordField = 'password';
    if (table === 'tbca') passwordField = 'fdpassword';

    // Build update query
    const query = `UPDATE ${table} SET ${passwordField} = ? WHERE ${table === 'tbca' ? 'fdSiNo' : 'id'} = ?`;
    const idFieldValue = id;

    const [result] = await db.query(query, [hashed, idFieldValue]);

    // Optionally, you might want to check affectedRows
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    if (err.name === 'TokenExpiredError') return res.status(400).json({ message: 'Token expired' });
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
