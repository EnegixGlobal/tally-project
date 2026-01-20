const express = require("express");
const router = express.Router();
const db = require("../db");



router.get("/purchase", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;
    console.log("purchase route hit");

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }

    // 🔹 COMPANY STATE
    const [companyRows] = await db.query(
      `SELECT state FROM tbcompanies WHERE id = ?`,
      [company_id]
    );

    const companyStateRaw = companyRows[0]?.state || "";
    const companyStateCode = companyStateRaw.match(/\((\d+)\)/)?.[1];

    // 🔹 PURCHASE DATA
    const [rows] = await db.query(
      `
      SELECT
        LOWER(l.name) AS ledgerName,
        MONTH(pv.date) AS month,
        SUM(pv.total) AS total,
        sl.state AS supplierState
      FROM purchase_vouchers pv

      -- GST PURCHASE LEDGER
      JOIN ledgers l ON l.id = pv.purchaseLedgerId  

      -- SUPPLIER LEDGER
      JOIN ledgers sl ON sl.id = pv.partyId

      WHERE pv.company_id = ?
        AND pv.owner_type = ?
        AND pv.owner_id = ?
        AND LOWER(l.name) IN (
          '0% gst purchase',
          '3% gst purchase',
          '5% gst purchase',
          '12% gst purchase',
          '18% gst purchase',
          '28% gst purchase'
        )
      GROUP BY l.name, MONTH(pv.date), sl.state
      `,
      [company_id, owner_type, owner_id]
    );

    // 🔹 INTRA / INTER DECISION (🔥 SAME AS SALES)
    const finalData = rows.map(r => {
      const supplierStateCode =
        r.supplierState?.match(/\((\d+)\)/)?.[1];

      return {
        ledgerName: r.ledgerName,
        month: r.month,
        total: r.total,
        supplyType:
          supplierStateCode === companyStateCode ? "INTRA" : "INTER",
      };
    });

    res.json({
      success: true,
      data: finalData,
    });

  } catch (error) {
    console.error("GST purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});



router.get("/sales", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;
    console.log("sales route hit");

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }

    // 🔹 COMPANY STATE
    const [companyRows] = await db.query(
      `SELECT state FROM tbcompanies WHERE id = ?`,
      [company_id]
    );

    const companyStateRaw = companyRows[0]?.state || "";
    const companyStateCode = companyStateRaw.match(/\((\d+)\)/)?.[1];

    const [rows] = await db.query(
      `
      SELECT
        LOWER(gl.name) AS ledgerName,
        MONTH(sv.date) AS month,
        SUM(sv.total) AS total,
        cl.state AS customerState
      FROM sales_vouchers sv

      -- GST SALES LEDGER
      JOIN ledgers gl ON gl.id = sv.salesLedgerId

      -- CUSTOMER LEDGER
      JOIN ledgers cl ON cl.id = sv.partyId

      WHERE sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?
        AND sv.type = 'sales'
        AND LOWER(gl.name) IN (
          '0% gst sales',
          '3% gst sales',
          '5% gst sales',
          '12% gst sales',
          '18% gst sales',
          '28% gst sales'
        )
      GROUP BY gl.name, MONTH(sv.date), cl.state
      `,
      [company_id, owner_type, owner_id]
    );

    // 🔹 INTRA / INTER DECISION
    const finalData = rows.map(r => {
      const customerStateCode =
        r.customerState?.match(/\((\d+)\)/)?.[1];

      return {
        ...r,
        supplyType:
          customerStateCode === companyStateCode ? "INTRA" : "INTER",
      };
    });

    res.json({
      success: true,
      data: finalData,
    });

  } catch (error) {
    console.error("GST sales error:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});




router.get("/debit-notes", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;
    console.log("debit notes route hit");

    const GST_RATES = ["0%", "3%", "5%", "12%", "18%", "28%"];


    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }

    /* 🔹 COMPANY STATE */
    const [companyRows] = await db.query(
      `SELECT state FROM tbcompanies WHERE id = ?`,
      [company_id]
    );

    const companyStateCode =
      companyRows[0]?.state?.match(/\((\d+)\)/)?.[1] || "";

    /* 🔹 FETCH ALL LEDGERS (for GST % detection) */
    const [ledgerRows] = await db.query(`
      SELECT id, LOWER(name) AS name
      FROM ledgers
    `);

    const ledgerMap = {};
    ledgerRows.forEach(l => {
      ledgerMap[l.id] = l.name;
    });

    /* 🔹 DEBIT NOTES */
    const [rows] = await db.query(
      `
      SELECT
        MONTH(dnv.date) AS month,
        dnv.narration,
        sl.state AS partyState
      FROM debit_note_vouchers dnv
      LEFT JOIN ledgers sl ON sl.id = dnv.party_id
      WHERE dnv.company_id = ?
        AND dnv.owner_type = ?
        AND dnv.owner_id = ?
      `,
      [company_id, owner_type, owner_id]
    );

    const result = [];

    for (const r of rows) {
      let narration;
      try {
        narration = JSON.parse(r.narration || "{}");
      } catch {
        continue;
      }

      const entries = narration.accountingEntries || [];

      for (const e of entries) {
        if (e.type !== "debit") continue;

        const ledgerName = ledgerMap[e.ledgerId] || "";

        const gstRate = GST_RATES.find(rate =>
          ledgerName.includes(rate)
        );

        if (!gstRate) continue;

        const partyStateCode =
          r.partyState?.match(/\((\d+)\)/)?.[1] || "";

        result.push({
          ledgerName: `${gstRate} debit notes`,
          month: r.month,
          total: Number(e.amount || 0),
          supplyType:
            partyStateCode === companyStateCode ? "INTRA" : "INTER",
        });
      }
    }

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("Debit note GST error:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});



router.get("/credit-notes", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;
    console.log("credit notes route hit");

    const GST_RATES = ["0%", "3%", "5%", "12%", "18%", "28%"];

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }

    /* 🔹 COMPANY STATE */
    const [companyRows] = await db.query(
      `SELECT state FROM tbcompanies WHERE id = ?`,
      [company_id]
    );

    const companyStateCode =
      companyRows[0]?.state?.match(/\((\d+)\)/)?.[1] || "";

    /* 🔹 LEDGERS */
    const [ledgerRows] = await db.query(`
      SELECT id, LOWER(name) AS name
      FROM ledgers
    `);

    const ledgerMap = {};
    ledgerRows.forEach(l => {
      ledgerMap[l.id] = l.name;
    });

    /* 🔹 CREDIT NOTES (correct table) */
    const [rows] = await db.query(
      `
      SELECT
        MONTH(cnv.date) AS month,
        cnv.narration,
        sl.state AS partyState
      FROM credit_vouchers cnv
      LEFT JOIN ledgers sl ON sl.id = cnv.partyId
      WHERE cnv.company_id = ?
        AND cnv.owner_type = ?
        AND cnv.owner_id = ?
      `,
      [company_id, owner_type, owner_id]
    );

    const result = [];

    for (const r of rows) {
      let narration;
      try {
        narration = JSON.parse(r.narration || "{}");
      } catch {
        continue;
      }

      const entries = narration.accountingEntries || [];

      for (const e of entries) {
        // ✅ GST LEDGER IS ALWAYS DEBIT
        if (e.type !== "debit") continue;

        const ledgerName = ledgerMap[e.ledgerId] || "";

        const gstRate = GST_RATES.find(rate =>
          ledgerName.includes(rate)
        );

        if (!gstRate) continue;

        const partyStateCode =
          r.partyState?.match(/\((\d+)\)/)?.[1] || "";

        let supplyType = "UNKNOWN";
        if (partyStateCode && companyStateCode) {
          supplyType =
            partyStateCode === companyStateCode ? "INTRA" : "INTER";
        }

        result.push({
          ledgerName: `${gstRate} credit notes`,
          month: r.month,
          total: Number(e.amount || 0),
          supplyType,
        });
      }
    }

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("Credit note GST error:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});












module.exports = router;
