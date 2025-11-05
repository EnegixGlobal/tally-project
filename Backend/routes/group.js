const express = require('express');
const router = express.Router();
const db = require('../db');
// const checkPermission = require('../middlewares/checkPermission');



// =========================
// Create single group (RBAC protected)
// =========================
router.post('/', async (req, res) => {
  try {
    const {
      name, alias, parent, type, nature,
      behavesLikeSubLedger, nettBalancesForReporting, usedForCalculation, allocationMethod,
      setAlterHSNSAC, hsnSacClassificationId, hsnCode,
      setAlterGST, gstClassificationId, typeOfSupply, taxability,
      integratedTaxRate, cess,
      companyId, ownerType, ownerId
    } = req.body;

    if (!companyId || !ownerType || !ownerId || !name) {
      return res.status(400).json({ message: "companyId, ownerType, ownerId and name are required" });
    }

    await db.execute(
      `INSERT INTO ledger_groups (
        name, alias, parent, type, nature,
        behavesLikeSubLedger, nettBalancesForReporting, usedForCalculation, allocationMethod,
        setAlterHSNSAC, hsnSacClassificationId, hsnCode,
        setAlterGST, gstClassificationId, typeOfSupply, taxability,
        integratedTaxRate, cess,
        company_id, owner_type, owner_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, alias || null, parent || null, type || null, nature || null,
        behavesLikeSubLedger ? 1 : 0,
        nettBalancesForReporting ? 1 : 0,
        usedForCalculation ? 1 : 0,
        allocationMethod || null,
        setAlterHSNSAC ? 1 : 0,
        hsnSacClassificationId || null,
        hsnCode || null,
        setAlterGST ? 1 : 0,
        gstClassificationId || null,
        typeOfSupply || null,
        taxability || null,
        integratedTaxRate || null,
        cess || null,
        companyId, ownerType, ownerId
      ]
    );

    res.json({ message: 'Group created successfully' });
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ message: 'Failed to create group' });
  }
});

// =========================
// Bulk create groups (RBAC protected)
// =========================
router.post('/bulk', async (req, res) => {
  const { groups, companyId, ownerType, ownerId } = req.body;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ message: "companyId, ownerType, and ownerId are required" });
  }
  if (!groups || !Array.isArray(groups) || groups.length === 0) {
    return res.status(400).json({ message: 'Invalid groups data' });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const sql = `
      INSERT INTO ledger_groups
      (name, alias, parent, type, nature,
       behavesLikeSubLedger, nettBalancesForReporting, usedForCalculation, allocationMethod,
       setAlterHSNSAC, hsnSacClassificationId, hsnCode,
       setAlterGST, gstClassificationId, typeOfSupply, taxability,
       integratedTaxRate, cess,
       company_id, owner_type, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const results = [];

    for (const grp of groups) {
      const {
        name, alias, parent, type, nature,
        behavesLikeSubLedger, nettBalancesForReporting, usedForCalculation, allocationMethod,
        setAlterHSNSAC, hsnSacClassificationId, hsnCode,
        setAlterGST, gstClassificationId, typeOfSupply, taxability,
        integratedTaxRate, cess
      } = grp;

      if (!name) {
        throw new Error(`Group name required for one of the records`);
      }

      await conn.execute(sql, [
        name, alias || null, parent || null, type || null, nature || null,
        behavesLikeSubLedger ? 1 : 0,
        nettBalancesForReporting ? 1 : 0,
        usedForCalculation ? 1 : 0,
        allocationMethod || null,
        setAlterHSNSAC ? 1 : 0,
        hsnSacClassificationId || null,
        hsnCode || null,
        setAlterGST ? 1 : 0,
        gstClassificationId || null,
        typeOfSupply || null,
        taxability || null,
        integratedTaxRate || null,
        cess || null,
        companyId, ownerType, ownerId
      ]);

      results.push({ name, status: 'created' });
    }

    await conn.commit();
    res.status(201).json({
      message: `${results.length} group(s) created successfully!`,
      results
    });
  } catch (err) {
    await conn.rollback();
    console.error('Bulk group insert error:', err);
    res.status(500).json({ message: 'Failed to create ledger groups', error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
