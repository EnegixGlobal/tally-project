const express = require('express');
const router = express.Router();
const pool = require('../db');


router.get("/ledger-report", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    // ✅ Correct Group Mapping
    const groupedData = {
      "-6": { name: "Sundry Creditor", ledgers: [] },
      "-15": { name: "Purchase Account", ledgers: [] },
      "-13": { name: "Current Liability", ledgers: [], subGroups: {} },
      "-11": { name: "Indirect Income", ledgers: [] },
    };

    // 🔹 1️⃣ Get Main Group Ledgers
    const [mainLedgers] = await pool.execute(
      `SELECT id, name, group_id, opening_balance, balance_type, closing_balance
       FROM ledgers
       WHERE company_id = ?
         AND owner_type = ?
         AND owner_id = ?
         AND group_id IN (-6, -15, -13, -11)
       ORDER BY group_id, name`,
      [company_id, owner_type, owner_id]
    );

    mainLedgers.forEach((ledger) => {
      if (groupedData[ledger.group_id]) {
        groupedData[ledger.group_id].ledgers.push(ledger);
      }
    });

    // 🔹 2️⃣ Get All Sub-Groups for these Top Level Groups
    // We want groups where parent is IN (-6, -15, -13, -11)
    const [subGroups] = await pool.execute(
      `SELECT id, name, parent 
       FROM ledger_groups 
       WHERE parent IN (-6, -15, -13, -11) 
         AND company_id = ?`,
      [company_id]
    );

    // Map subGroup ID -> SubGroup Object
    const subGroupsMap = {};
    const subGroupIds = [];

    subGroups.forEach(group => {
      subGroupsMap[group.id] = group;
      subGroupIds.push(group.id);
    });

    if (subGroupIds.length > 0) {
      // 🔹 3️⃣ Get Ledgers for these Sub-Groups
      // We need to dynamically build the IN clause placeholders
      const placeholders = subGroupIds.map(() => '?').join(',');

      const [subGroupLedgers] = await pool.execute(
        `SELECT id, name, group_id, opening_balance, balance_type, closing_balance
         FROM ledgers
         WHERE company_id = ?
           AND owner_type = ?
           AND owner_id = ?
           AND group_id IN (${placeholders})
         ORDER BY name`,
        [company_id, owner_type, owner_id, ...subGroupIds]
      );

      // 🔹 4️⃣ Organize Sub-Group Ledgers into groupedData
      subGroupLedgers.forEach(ledger => {
        const group = subGroupsMap[ledger.group_id]; // Get the group info (parent, name)
        if (group) {
          const parentId = group.parent; // e.g., -6, -13
          const subGroupName = group.name; // e.g., "Sundry Creditors", "Duties & Taxes"

          // Ensure parent exists in groupedData (it should)
          if (groupedData[parentId]) {
            // Ensure subGroups object exists
            if (!groupedData[parentId].subGroups) {
              groupedData[parentId].subGroups = {};
            }
            // Ensure specific subGroup key exists
            if (!groupedData[parentId].subGroups[subGroupName]) {
              groupedData[parentId].subGroups[subGroupName] = [];
            }

            // Add ledger to the subgroup
            groupedData[parentId].subGroups[subGroupName].push(ledger);
          }
        }
      });
    }

    res.json({
      success: true,
      data: groupedData,
    });

  } catch (error) {
    console.error("Ledger Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});








router.get("/", async (req, res) => {
  // console.log("Purchase Report API Hit");

  try {
    const finalCompanyId = req.query.company_id || req.body?.companyId;
    const finalOwnerType = req.query.owner_type || req.body?.ownerType;
    const finalOwnerId = req.query.owner_id || req.body?.ownerId;

    if (!finalCompanyId || !finalOwnerType || !finalOwnerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const [rows] = await pool.execute(
      `SELECT 
                pv.id,
                pv.number as voucherNo,
                pv.date,
                pv.total as netAmount,
                pv.total,
                pv.subtotal as taxableAmount,
                pv.cgstTotal as cgstAmount,
                pv.sgstTotal as sgstAmount,
                pv.igstTotal as igstAmount,
                
                l.id as ledgerId,
                l.name as partyName,
                l.group_id,          -- ✅ IMPORTANT
                l.gst_number as partyGSTIN

            FROM purchase_vouchers pv
            LEFT JOIN ledgers l ON pv.partyId = l.id
            WHERE pv.company_id = ?
              AND pv.owner_type = ?
              AND pv.owner_id = ?
            ORDER BY pv.date DESC`,
      [finalCompanyId, finalOwnerType, finalOwnerId]
    );

    // console.log('data', rows)

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.error("Purchase Report Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});










module.exports = router;





