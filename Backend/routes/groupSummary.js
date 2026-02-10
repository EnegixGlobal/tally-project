const express = require('express');
const router = express.Router();
const pool = require('../db');




router.get("/api/group", async (req, res) => {
  try {

    const { company_id, owner_type, owner_id, ledgerIds } = req.query;


    if (!company_id || !owner_type || !owner_id || !ledgerIds) {
      return res.status(400).json({
        success: false,
        message: "Missing Query Params",
      });
    }

    const idArray = ledgerIds
      .split(",")
      .map(id => Number(id))
      .filter(id => !isNaN(id));

    if (!idArray.length) {
      return res.json({
        success: true,
        data: {},
      });
    }

    const [rows] = await pool.query(

      `
      SELECT
        ledgerId,
        SUM(debit)  AS debit,
        SUM(credit) AS credit

      FROM (

        /* ================= PURCHASE ================= */

        SELECT
          CAST(pvi.cgstRate AS UNSIGNED) AS ledgerId,
          pv.cgstTotal AS debit,
          0 AS credit
        FROM purchase_voucher_items pvi
        JOIN purchase_vouchers pv ON pvi.voucherId = pv.id
        WHERE pvi.cgstRate IN (?)
          AND pv.company_id = ?
          AND pv.owner_type = ?
          AND pv.owner_id = ?

        UNION ALL

        SELECT
          CAST(pvi.sgstRate AS UNSIGNED) AS ledgerId,
          pv.sgstTotal,
          0
        FROM purchase_voucher_items pvi
        JOIN purchase_vouchers pv ON pvi.voucherId = pv.id
        WHERE pvi.sgstRate IN (?)
          AND pv.company_id = ?
          AND pv.owner_type = ?
          AND pv.owner_id = ?

        UNION ALL

        SELECT
          CAST(pvi.igstRate AS UNSIGNED) AS ledgerId,
          pv.igstTotal,
          0
        FROM purchase_voucher_items pvi
        JOIN purchase_vouchers pv ON pvi.voucherId = pv.id
        WHERE pvi.igstRate IN (?)
          AND pv.company_id = ?
          AND pv.owner_type = ?
          AND pv.owner_id = ?

        UNION ALL

        SELECT
          CAST(pvi.purchaseLedgerId AS UNSIGNED) AS ledgerId,
          pvi.amount,
          0
        FROM purchase_voucher_items pvi
        JOIN purchase_vouchers pv ON pvi.voucherId = pv.id
        WHERE pvi.purchaseLedgerId IN (?)
          AND pv.company_id = ?
          AND pv.owner_type = ?
          AND pv.owner_id = ?


        UNION ALL

        SELECT
          CAST(pvi.tdsRate AS UNSIGNED) AS ledgerId,
          pv.tdsTotal AS debit,
          0 AS credit
        FROM purchase_voucher_items pvi
        JOIN purchase_vouchers pv ON pvi.voucherId = pv.id
        WHERE pvi.tdsRate IN (?)
          AND pv.company_id = ?
          AND pv.owner_type = ?
          AND pv.owner_id = ?


        /* ================= SALES ================= */

        UNION ALL

        SELECT
          CAST(svi.cgstRate AS UNSIGNED) AS ledgerId,
          0,
          sv.cgstTotal
        FROM sales_voucher_items svi
        JOIN sales_vouchers sv ON svi.voucherId = sv.id
        WHERE svi.cgstRate IN (?)
          AND sv.company_id = ?
          AND sv.owner_type = ?
          AND sv.owner_id = ?

        UNION ALL

        SELECT
          CAST(svi.sgstRate AS UNSIGNED) AS ledgerId,
          0,
          sv.sgstTotal
        FROM sales_voucher_items svi
        JOIN sales_vouchers sv ON svi.voucherId = sv.id
        WHERE svi.sgstRate IN (?)
          AND sv.company_id = ?
          AND sv.owner_type = ?
          AND sv.owner_id = ?

        UNION ALL

        SELECT
          CAST(svi.igstRate AS UNSIGNED) AS ledgerId,
          0,
          sv.igstTotal
        FROM sales_voucher_items svi
        JOIN sales_vouchers sv ON svi.voucherId = sv.id
        WHERE svi.igstRate IN (?)
          AND sv.company_id = ?
          AND sv.owner_type = ?
          AND sv.owner_id = ?

        UNION ALL

        SELECT
          CAST(svi.salesLedgerId AS UNSIGNED) AS ledgerId,
          0,
          svi.amount
        FROM sales_voucher_items svi
        JOIN sales_vouchers sv ON svi.voucherId = sv.id
        WHERE svi.salesLedgerId IN (?)
          AND sv.company_id = ?
          AND sv.owner_type = ?
          AND sv.owner_id = ?


        /* ================= PARTY ================= */

        UNION ALL

        SELECT
          CAST(pv.partyId AS UNSIGNED) AS ledgerId,
          0,
          pv.total
        FROM purchase_vouchers pv
        WHERE pv.partyId IN (?)
          AND pv.company_id = ?
          AND pv.owner_type = ?
          AND pv.owner_id = ?

        UNION ALL

        SELECT
          CAST(sv.partyId AS UNSIGNED) AS ledgerId,
          sv.total,
          0
        FROM sales_vouchers sv
        WHERE sv.partyId IN (?)
          AND sv.company_id = ?
          AND sv.owner_type = ?
          AND sv.owner_id = ?


        /* ================= JOURNAL / CONTRA / PAYMENT ================= */

        UNION ALL

        SELECT
          CAST(ve.ledger_id AS UNSIGNED) AS ledgerId,

          CASE
            WHEN ve.entry_type = 'debit' THEN ve.amount
            ELSE 0
          END AS debit,

          CASE
            WHEN ve.entry_type = 'credit' THEN ve.amount
            ELSE 0
          END AS credit

        FROM voucher_entries ve
        JOIN voucher_main vm ON vm.id = ve.voucher_id

        WHERE ve.ledger_id IN (?)
          AND vm.voucher_type IN ('journal','contra','payment','receipt')
          AND vm.company_id = ?
          AND vm.owner_type = ?
          AND vm.owner_id = ?

      ) AS final_data

      GROUP BY ledgerId
      `,

      [

        // Purchase
        idArray, company_id, owner_type, owner_id,
        idArray, company_id, owner_type, owner_id,
        idArray, company_id, owner_type, owner_id,
        idArray, company_id, owner_type, owner_id,
        idArray, company_id, owner_type, owner_id,

        // Sales
        idArray, company_id, owner_type, owner_id,
        idArray, company_id, owner_type, owner_id,
        idArray, company_id, owner_type, owner_id,
        idArray, company_id, owner_type, owner_id,

        // Party
        idArray, company_id, owner_type, owner_id,
        idArray, company_id, owner_type, owner_id,

        // Journal
        idArray, company_id, owner_type, owner_id,
      ]
    );


    const result = {};

    rows.forEach(row => {

      const id = Number(row.ledgerId);

      if (!isNaN(id)) {
        result[id] = {
          debit: Number(row.debit || 0),
          credit: Number(row.credit || 0),
        };
      }

    });

    res.json({
      success: true,
      data: result,
    });

  } catch (err) {

    console.error("Group API Error:", err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


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
        l.closing_balance,

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
