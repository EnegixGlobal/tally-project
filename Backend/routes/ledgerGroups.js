const express = require("express");
const router = express.Router();
const db = require("../db");

// const checkPermission = require('../middlewares/checkPermission');
// =========================
// GET groups (RBAC protected)
// =========================
router.get("/", async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res
      .status(400)
      .json({ message: "company_id, owner_type, and owner_id are required" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT *
       FROM ledger_groups
       WHERE (company_id = ? AND owner_type = ? AND owner_id = ?) 
       OR (company_id = 0 AND owner_type = 'employee' AND owner_id = 0)
       ORDER BY name`,
      [company_id, owner_type, owner_id]
    );

    // console.log('rows', rows.length)
    res.json(rows);
  } catch (err) {
    console.error("Error fetching ledger groups:", err);
    res.status(500).json({ message: "Failed to fetch ledger groups" });
  }
});

router.post("/", async (req, res) => {
  const payload = req.body;

  const ownerId = parseInt(payload.ownerId, 10);
  const ownerType = payload.ownerType;

  if (!ownerType || isNaN(ownerId)) {
    return res
      .status(400)
      .json({ message: "Missing or invalid ownerType/ownerId/companyId" });
  }

  if (!payload.name || !payload.under) {
    return res
      .status(400)
      .json({ message: "Ledger group name and 'under' field are required" });
  }

  try {
    // 🔹 Insert into DB
    const [result] = await db.execute(
      `INSERT INTO ledger_groups
       (name, alias, parent, type, nature, behavesLikeSubLedger, 
        nettBalancesForReporting, usedForCalculation, allocationMethod, 
        setAlterHSNSAC, hsnSacClassificationId, hsnCode, 
        setAlterGST, gstClassificationId, typeOfSupply, taxability, 
        integratedTaxRate, cess, owner_type, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.name,
        payload.alias || null,
        payload.under || null,
        payload.type || null,
        payload.nature || null,
        payload.behavesLikeSubLedger === "yes" ? 1 : 0,
        payload.nettBalancesForReporting === "yes" ? 1 : 0,
        payload.usedForCalculation === "yes" ? 1 : 0,
        payload.allocationMethod || null,
        payload.setAlterHSNSAC === "yes" ? 1 : 0,
        payload.hsnSacClassificationId || null,
        payload.hsnCode || null,
        payload.setAlterGST === "yes" ? 1 : 0,
        payload.gstClassificationId || null,
        payload.typeOfSupply || null,
        payload.taxability || null,
        payload.integratedTaxRate ? parseFloat(payload.integratedTaxRate) : 0,
        payload.cess ? parseFloat(payload.cess) : 0,
        ownerType,
        ownerId,
      ]
    );

    res.status(201).json({
      message: "Ledger group created successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating ledger group:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const ledgerId = parseInt(req.params.id, 10);
  const ownerType = req.query.ownerType?.toLowerCase();
  const ownerId = parseInt(req.query.ownerId, 10);

  if (isNaN(ledgerId)) {
    return res.status(400).json({ message: "Invalid ledger ID" });
  }

  try {
    let rows;

    // 🔹 If ownerType and ownerId are provided, try strict match
    if (ownerType && !isNaN(ownerId)) {
      [rows] = await db.execute(
        `SELECT * FROM ledger_groups WHERE id = ? AND owner_type = ? AND owner_id = ?`,
        [ledgerId, ownerType, ownerId]
      );
    }

    // 🔹 If no result (old record without owner info), try fallback query
    if (!rows || rows.length === 0) {
      [rows] = await db.execute(
        `SELECT * FROM ledger_groups WHERE id = ?`,
        [ledgerId]
      );
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Error fetching ledger group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const ledgerId = parseInt(req.params.id, 10);
  const payload = req.body;


  // console.log("Payload received in body:", payload);

  if (isNaN(ledgerId)) {
    return res.status(400).json({ message: "Invalid ledger group ID" });
  }

  const ownerId = parseInt(payload.ownerId, 10);
  const ownerType = payload.ownerType;

  if (!ownerType || isNaN(ownerId)) {
    return res
      .status(400)
      .json({ message: "Missing or invalid ownerType/ownerId" });
  }

  try {
    // 🔹 Check if ledger exists
    const [existing] = await db.execute(
      `SELECT * FROM ledger_groups WHERE id = ? AND owner_type = ? `,
      [ledgerId, ownerType]
    );

    // console.log(ledgerId, ownerType, ownerId);
    // console.log("Existing ledger group:", [existing]);

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ message: "Ledger group not found or unauthorized" });
    }

    // 🔹 Update DB
    await db.execute(
      `UPDATE ledger_groups
       SET name = ?, 
           alias = ?, 
           parent = ?, 
           type = ?, 
           nature = ?, 
           behavesLikeSubLedger = ?, 
           nettBalancesForReporting = ?, 
           usedForCalculation = ?, 
           allocationMethod = ?, 
           setAlterHSNSAC = ?, 
           hsnSacClassificationId = ?, 
           hsnCode = ?, 
           setAlterGST = ?, 
           gstClassificationId = ?, 
           typeOfSupply = ?, 
           taxability = ?, 
           integratedTaxRate = ?, 
           cess = ?
       WHERE id = ? AND owner_type = ?`,
      [
        payload.name,
        payload.alias || null,
        payload.under || null,
        payload.type || null,
        payload.nature || null,
        payload.behavesLikeSubLedger === "yes" ? 1 : 0,
        payload.nettBalancesForReporting === "yes" ? 1 : 0,
        payload.usedForCalculation === "yes" ? 1 : 0,
        payload.allocationMethod || null,
        payload.setAlterHSNSAC === "yes" ? 1 : 0,
        payload.hsnSacClassificationId || null,
        payload.hsnCode || null,
        payload.setAlterGST === "yes" ? 1 : 0,
        payload.gstClassificationId || null,
        payload.typeOfSupply || null,
        payload.taxability || null,
        payload.integratedTaxRate ? parseFloat(payload.integratedTaxRate) : 0,
        payload.cess ? parseFloat(payload.cess) : 0,
        ledgerId,
        ownerType,
      ]
    );

    res.json({ message: "Ledger group updated successfully" });
  } catch (err) {
    console.error("Error updating ledger group:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const ledgerId = parseInt(req.params.id, 10);

  if (isNaN(ledgerId)) {
    return res.status(400).json({ message: "Invalid ledger group ID" });
  }

  try {
    const [check] = await db.execute(
      "SELECT id FROM ledger_groups WHERE id = ?",
      [ledgerId]
    );

    if (check.length === 0) {
      return res.status(404).json({ message: "Ledger group not found" });
    }

    const [result] = await db.execute(
      "DELETE FROM ledger_groups WHERE id = ?",
      [ledgerId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Ledger group not found or already deleted" });
    }

    res.json({ message: "Ledger group deleted successfully" });
  } catch (error) {
    console.error("Error deleting ledger group:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
