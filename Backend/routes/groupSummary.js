const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/group-summary
router.get("/api/group-summary", async (req, res) => {
  const { groupType, company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({
      error: "Missing tenant parameters (company_id, owner_type, owner_id)",
    });
  }

  try {
    /* =====================================================
       1️⃣ FETCH LEDGER GROUPS (WITH PARENT DATA)
    ===================================================== */
    const [ledgerGroups] = await pool.query(
      `
      SELECT
        g.id,
        g.name,
        g.type,
        g.nature,
        g.parent               AS parent_id,
        pg.name                AS parent_name,
        pg.type                AS parent_type,
        pg.nature              AS parent_nature,
        g.alias,
        g.behavesLikeSubLedger,
        g.nettBalancesForReporting,
        g.usedForCalculation,
        g.allocationMethod,
        g.company_id,
        g.owner_type,
        g.owner_id
      FROM ledger_groups g
      LEFT JOIN ledger_groups pg ON g.parent = pg.id
      WHERE g.company_id = ?
        AND g.owner_type = ?
        AND g.owner_id = ?
      ORDER BY g.name
      `,
      [company_id, owner_type, owner_id]
    );

    /* =====================================================
       2️⃣ BUILD LEDGERS QUERY (WITH GROUP + PARENT GROUP)
    ===================================================== */
    let ledgersSql = `
      SELECT
        l.id,
        l.name,
        l.group_id,
        l.opening_balance,
        l.balance_type,

        g.name     AS group_name,
        g.type     AS group_type,
        g.nature   AS group_nature,
        g.parent   AS parent_group_id,

        pg.name    AS parent_group_name,
        pg.type    AS parent_group_type,
        pg.nature  AS parent_group_nature
      FROM ledgers l
      LEFT JOIN ledger_groups g  ON l.group_id = g.id
      LEFT JOIN ledger_groups pg ON g.parent = pg.id
      WHERE l.company_id = ?
        AND l.owner_type = ?
        AND l.owner_id = ?
    `;

    const params = [company_id, owner_type, owner_id];

    // Optional filter by group type (Assets / Liabilities / etc.)
    if (groupType) {
      ledgersSql += " AND g.type = ?";
      params.push(groupType);
    }

    ledgersSql += " ORDER BY l.name";

    const [ledgers] = await pool.query(ledgersSql, params);

    /* =====================================================
       3️⃣ NORMALIZE LEDGER DATA
    ===================================================== */
    const normalizedLedgers = ledgers.map((ledger) => ({
      ...ledger,
      opening_balance: parseFloat(ledger.opening_balance) || 0,
    }));

    /* =====================================================
       4️⃣ FINAL RESPONSE
    ===================================================== */
    res.json({
      ledgerGroups,
      ledgers: normalizedLedgers,
    });
  } catch (error) {
    console.error("Error fetching group summary data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
