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
  const companyId = parseInt(payload.companyId, 10);

  console.log("form", req.body);

  if (!ownerType || isNaN(ownerId) || isNaN(companyId)) {
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
    // -----------------------------------------
    // 1️⃣ Extract actual parent name
    // -----------------------------------------
    let parentName = null;
    let parentId = null;

    if (payload.under.includes(":")) {
      parentName = payload.under.split(":")[1].trim(); // "Branch/Division"
    } else {
      parentName = payload.under.trim();
    }

    // -----------------------------------------
    // 2️⃣ Check if parent group already exists
    // -----------------------------------------
    const [existingParent] = await db.execute(
      `SELECT id FROM ledger_groups
       WHERE name = ? AND company_id = ? LIMIT 1`,
      [parentName, companyId]
    );

    if (existingParent.length > 0) {
      parentId = existingParent[0].id;
    } else {
      // -----------------------------------------
      // 3️⃣ Parent DOES NOT EXIST → AUTO CREATE
      // -----------------------------------------
      const [insertParent] = await db.execute(
        `INSERT INTO ledger_groups
        (company_id, name, alias, parent, type, nature,
         behavesLikeSubLedger, nettBalancesForReporting, usedForCalculation,
         allocationMethod, setAlterHSNSAC, hsnSacClassificationId, hsnCode,
         setAlterGST, gstClassificationId, typeOfSupply, taxability,
         integratedTaxRate, cess, owner_type, owner_id)
        VALUES (?, ?, NULL, NULL, NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, ?, ?)`,
        [companyId, parentName, ownerType, ownerId]
      );

      parentId = insertParent.insertId;
      console.log("AUTO CREATED PARENT GROUP:", parentId, parentName);
    }

    // -----------------------------------------
    // 4️⃣ Now insert NEW ledger group with parentId
    // -----------------------------------------
    const [result] = await db.execute(
      `INSERT INTO ledger_groups
       (company_id, name, alias, parent, type, nature, behavesLikeSubLedger, 
        nettBalancesForReporting, usedForCalculation, allocationMethod, 
        setAlterHSNSAC, hsnSacClassificationId, hsnCode, 
        setAlterGST, gstClassificationId, typeOfSupply, taxability, 
        integratedTaxRate, cess, owner_type, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        payload.name,
        payload.alias || null,
        parentId, // ✔ FIXED: Now parentId will be correctly saved
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

    // strict match
    if (ownerType && !isNaN(ownerId)) {
      [rows] = await db.execute(
        `SELECT * FROM ledger_groups WHERE id = ? AND owner_type = ? AND owner_id = ?`,
        [ledgerId, ownerType, ownerId]
      );
    }

    // fallback
    if (!rows || rows.length === 0) {
      [rows] = await db.execute(`SELECT * FROM ledger_groups WHERE id = ?`, [
        ledgerId,
      ]);
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    let ledger = rows[0];

    // -----------------------------------------------------
    // Get parent name instead of parent id
    // -----------------------------------------------------
    let under = null;

    if (ledger.parent) {
      const [parentRow] = await db.execute(
        `SELECT name FROM ledger_groups WHERE id = ?`,
        [ledger.parent]
      );

      if (parentRow.length > 0) {
        under = parentRow[0].name; // <-- 🎉 Only name, NO "base:"
      }
    }

    // Return final object
    res.json({
      ...ledger,
      under, // final clean field
    });
  } catch (error) {
    console.error("❌ Error fetching ledger group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



router.put("/:id", async (req, res) => {
  const ledgerId = parseInt(req.params.id, 10);
  const payload = req.body;

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
    // Check if ledger exists
    const [existing] = await db.execute(
      `SELECT * FROM ledger_groups WHERE id = ? AND owner_type = ?`,
      [ledgerId, ownerType]
    );

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ message: "Ledger group not found or unauthorized" });
    }

 
    let parentName = null;
    let parentId = null;

    if (payload.under) {
      if (payload.under.includes(":")) {
        parentName = payload.under.split(":")[1].trim();
      } else {
        parentName = payload.under.trim();
      }

     
      const [existingParent] = await db.execute(
        `SELECT id FROM ledger_groups WHERE name = ? AND company_id = ? LIMIT 1`,
        [parentName, existing[0].company_id]
      );

      if (existingParent.length > 0) {
        parentId = existingParent[0].id;
      } else {
     
        const [insertParent] = await db.execute(
          `INSERT INTO ledger_groups
            (company_id, name, alias, parent, type, nature,
             behavesLikeSubLedger, nettBalancesForReporting, usedForCalculation,
             allocationMethod, setAlterHSNSAC, hsnSacClassificationId, hsnCode,
             setAlterGST, gstClassificationId, typeOfSupply, taxability,
             integratedTaxRate, cess, owner_type, owner_id)
           VALUES (?, ?, NULL, NULL, NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL,
                   0, NULL, NULL, NULL, NULL, NULL, ?, ?)`,
          [existing[0].company_id, parentName, ownerType, ownerId]
        );

        parentId = insertParent.insertId;
        console.log("AUTO CREATED PARENT GROUP (PUT):", parentId, parentName);
      }
    }

 
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
        parentId || null, // ✔ FIXED: actual INT parent ID saved
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
