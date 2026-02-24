const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

router.post('/company', async (req, res) => {

  const {
    name,
    financialYear,
    booksBeginningYear,
    address,
    pin,
    phoneNumber,
    email,
    panNumber,
    tanNumber,
    gstNumber,
    vatNumber,
    state,
    country,
    taxType,
    vaultPassword,
    accessControlEnabled,
    username,
    password,
    employeeId,
    maintainBy,
    accountantName
  } = req.body;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Check user limit before creating company
    const [userRows] = await connection.query(
      'SELECT userLimit FROM tbemployees WHERE id = ?',
      [employeeId]
    );

    const userLimit = userRows.length > 0 ? userRows[0].userLimit : 1;

    const [existingCompanies] = await connection.query(
      'SELECT COUNT(*) as count FROM tbcompanies WHERE employee_id = ?',
      [employeeId]
    );

    if (existingCompanies[0].count >= userLimit) {
      await connection.rollback();
      connection.release();
      return res.status(403).json({
        message: `Company limit reached. Your limit is ${userLimit} companies.`
      });
    }

    const [columns] = await connection.query(`
      SHOW COLUMNS FROM tbcompanies LIKE 'tan_number'
    `);

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE tbcompanies
        ADD COLUMN tan_number VARCHAR(20)
      `);

      console.log("✅ tan_number column created");
    }

    let hashedVaultPassword = null;

    if (vaultPassword) {
      hashedVaultPassword = await bcrypt.hash(vaultPassword, 10);
    }

    const [companyResult] = await connection.query(`
      INSERT INTO tbcompanies (
        name,
        financial_year,
        books_beginning_year,
        address,
        pin,
        phone_number,
        email,
        pan_number,
        tan_number,       
        gst_number,
        vat_number,
        state,
        country,
        tax_type,
        employee_id,
        vault_password,
        fdAccountType,
        fdAccountantName
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      financialYear,
      booksBeginningYear,
      address,
      pin,
      phoneNumber,
      email,
      panNumber,
      tanNumber,
      taxType === "GST" ? gstNumber : null,
      taxType === "VAT" ? vatNumber : null,
      state,
      country,
      taxType,
      employeeId,
      hashedVaultPassword || null,
      maintainBy || null,
      accountantName || null
    ]);

    const companyId = companyResult.insertId;

    if (accessControlEnabled && username && password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Try to get 'Admin' role ID
      const [roleRows] = await connection.query(
        "SELECT role_id FROM tbroles WHERE LOWER(role_name) = 'admin' LIMIT 1"
      );
      const roleId = roleRows.length > 0 ? roleRows[0].role_id : 0;

      await connection.query(`
        INSERT INTO tbusers (company_id, username, password, employee_id, email, role_id, status)
        VALUES (?, ?, ?, ?, ?, ?, 'active')
      `, [companyId, username, hashedPassword, employeeId, email, roleId]);
    }

    await connection.commit();
    connection.release();


    return res.status(201).json({
      message: 'Company created successfully',
      companyId
    });

  } catch (err) {

    await connection.rollback();
    connection.release();

    console.error("❌ Company creation error:", err);

    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
});


router.put('/company/:companyId', async (req, res) => {

  const { companyId } = req.params;

  const {
    name,
    financialYear,
    booksBeginningYear,
    address,
    pin,
    phoneNumber,
    email,
    panNumber,
    tanNumber,
    gstNumber,
    vatNumber,
    state,
    country,
    taxType,
    vaultPassword,
    accessControlEnabled,
    username,
    password,
    employeeId,
    maintainBy,
    accountantName
  } = req.body;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {

    const [columns] = await connection.query(`
      SHOW COLUMNS FROM tbcompanies LIKE 'tan_number'
    `);

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE tbcompanies
        ADD COLUMN tan_number VARCHAR(20)
      `);

      console.log("✅ tan_number column created");
    }

    let hashedVaultPassword = null;

    if (vaultPassword) {
      hashedVaultPassword = await bcrypt.hash(vaultPassword, 10);
    }

    await connection.query(`
      UPDATE tbcompanies SET
        name = ?,
        financial_year = ?,
        books_beginning_year = ?,
        address = ?,
        pin = ?,
        phone_number = ?,
        email = ?,
        pan_number = ?,
        tan_number = ?,       
        gst_number = ?,
        vat_number = ?,
        state = ?,
        country = ?,
        tax_type = ?,
        employee_id = ?,
        vault_password = COALESCE(?, vault_password),
        fdAccountType = ?,
        fdAccountantName = ?
      WHERE id = ?
    `, [
      name,
      financialYear,
      booksBeginningYear,
      address,
      pin,
      phoneNumber,
      email,
      panNumber,
      tanNumber,
      taxType === "GST" ? gstNumber : null,
      taxType === "VAT" ? vatNumber : null,
      state,
      country,
      taxType,
      employeeId,
      hashedVaultPassword,
      maintainBy || null,
      accountantName || null,
      companyId
    ]);

    if (accessControlEnabled && username) {

      let hashedPassword = null;

      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const [existingUser] = await connection.query(
        `SELECT id FROM tbusers WHERE company_id = ?`,
        [companyId]
      );

      if (existingUser.length > 0) {

        await connection.query(`
          UPDATE tbusers SET
            username = ?,
            password = COALESCE(?, password),
            email = ?
          WHERE company_id = ?
        `, [username, hashedPassword || null, email, companyId]);

      } else {
        // Try to get 'Admin' role ID
        const [roleRows] = await connection.query(
          "SELECT role_id FROM tbroles WHERE LOWER(role_name) = 'admin' LIMIT 1"
        );
        const roleId = roleRows.length > 0 ? roleRows[0].role_id : 0;

        await connection.query(`
          INSERT INTO tbusers (company_id, username, password, employee_id, email, role_id, status)
          VALUES (?, ?, ?, ?, ?, ?, 'active')
        `, [companyId, username, hashedPassword, employeeId, email, roleId]);

      }
    } else if (accessControlEnabled === false) {
      // If access control is explicitly disabled, remove the company users
      await connection.query(
        `DELETE FROM tbusers WHERE company_id = ?`,
        [companyId]
      );
    }

    await connection.commit();
    connection.release();

    return res.status(200).json({
      message: 'Company updated successfully',
      companyId
    });

  } catch (err) {

    await connection.rollback();
    connection.release();

    console.error("❌ Company update error:", err);

    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
});



router.get('/company/:companyId', async (req, res) => {

  const { companyId } = req.params;

  if (!companyId) {
    return res.status(400).json({ message: 'Company ID is required' });
  }

  const connection = await db.getConnection();

  try {

    const [columns] = await connection.query(`
      SHOW COLUMNS FROM tbcompanies LIKE 'tan_number'
    `);

    if (columns.length === 0) {

      await connection.query(`
        ALTER TABLE tbcompanies
        ADD COLUMN tan_number VARCHAR(20)
      `);

      console.log("✅ tan_number column auto created (GET)");
    }

    const [rows] = await connection.query(`
      SELECT 
        c.id,
        c.name,
        c.financial_year AS financialYear,
        c.books_beginning_year AS booksBeginningYear,
        c.address,
        c.pin,
        c.phone_number AS phoneNumber,
        c.email,
        c.pan_number AS panNumber,
        c.tan_number AS tanNumber,     
        c.gst_number AS gstNumber,
        c.vat_number AS vatNumber,
        c.state,
        c.country,
        c.tax_type AS taxType,
        c.fdAccountType AS maintainBy,
        c.fdAccountantName AS accountantName,
        c.vault_password IS NOT NULL as vaultEnabled,
        u.username,
        (u.id IS NOT NULL) as accessControlEnabled
      FROM tbcompanies c
      LEFT JOIN tbusers u ON c.id = u.company_id
      WHERE c.id = ?
      LIMIT 1
    `, [companyId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    return res.status(200).json(rows[0]);

  } catch (err) {

    console.error('❌ Fetch company error:', err);

    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });

  } finally {

    connection.release();

  }
});




// --- New GET route to fetch accountants ---
router.get('/accountants', async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.query('SELECT fdSiNo, fdname FROM tbCA');
    connection.release();
    return res.json(rows);
  } catch (err) {
    console.error('❌ Fetch accountants error:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router;
