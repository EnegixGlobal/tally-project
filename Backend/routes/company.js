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

      await connection.query(`
        INSERT INTO tbUsers (company_id, username, password)
        VALUES (?, ?, ?)
      `, [companyId, username, hashedPassword]);
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
        `SELECT id FROM tbUsers WHERE company_id = ?`,
        [companyId]
      );

      if (existingUser.length > 0) {

        await connection.query(`
          UPDATE tbUsers SET
            username = ?,
            password = COALESCE(?, password)
          WHERE company_id = ?
        `, [username, hashedPassword, companyId]);

      } else {

        await connection.query(`
          INSERT INTO tbUsers (company_id, username, password)
          VALUES (?, ?, ?)
        `, [companyId, username, hashedPassword]);

      }
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
        id,
        name,
        financial_year AS financialYear,
        books_beginning_year AS booksBeginningYear,
        address,
        pin,
        phone_number AS phoneNumber,
        email,
        pan_number AS panNumber,
        tan_number AS tanNumber,     
        gst_number AS gstNumber,
        vat_number AS vatNumber,
        state,
        country,
        tax_type AS taxType,
        fdAccountType AS maintainBy,
        fdAccountantName AS accountantName
      FROM tbcompanies
      WHERE id = ?
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
