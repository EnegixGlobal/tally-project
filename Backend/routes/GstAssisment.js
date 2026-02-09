const express = require("express");
const router = express.Router();
const db = require("../db");


router.get("/purchase", async (req, res) => {
  try {

    const { company_id, owner_type, owner_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }


    // ✅ Fetch All Related Ledgers
    const [rows] = await db.execute(
      `
      SELECT id, name
      FROM ledgers
      WHERE company_id = ?
        AND owner_type = ?
        AND (owner_id = ? OR owner_id = 0)
        AND (
          LOWER(name) LIKE '%purchase%'
          OR LOWER(name) LIKE '%igst%'
          OR LOWER(name) LIKE '%cgst%'
          OR LOWER(name) LIKE '%sgst%'
        )
      ORDER BY name
      `,
      [company_id, owner_type, owner_id]
    );


    // ✅ Group Data
    const ledgers = {
      purchase: [],
      igst: [],
      cgst: [],
      sgst: []
    };


    rows.forEach((row) => {

      const name = row.name.toLowerCase();

      if (name.includes("purchase")) {
        ledgers.purchase.push(row);
      }

      else if (name.includes("igst")) {
        ledgers.igst.push(row);
      }

      else if (name.includes("cgst")) {
        ledgers.cgst.push(row);
      }

      else if (name.includes("sgst")) {
        ledgers.sgst.push(row);
      }

    });

    // ✅ Fetch Transactions
    const [transactions] = await db.execute(`
      SELECT
        MONTH(v.date) as monthVal,
        i.purchaseLedgerId,
        i.amount,
        i.cgstRate,
        i.sgstRate,
        i.igstRate
      FROM purchase_vouchers v
      JOIN purchase_voucher_items i ON v.id = i.voucherId
      WHERE v.company_id = ? 
        AND v.owner_type = ? 
        AND v.owner_id = ?
    `, [company_id, owner_type, owner_id]);

    // ✅ Aggregate Data
    const monthlyData = {};

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // ✅ Create Ledger Map for ID Lookup
    const ledgerMap = new Map();
    rows.forEach(r => ledgerMap.set(r.id, r));

    // ✅ Helper to extract rate from ledger name
    const getRateFromLedger = (ledgerId) => {
      const ledger = ledgerMap.get(ledgerId);
      if (!ledger) return 0;

      // Extract numbers from string (e.g. "Input CGST 9%" -> 9, "SGST @ 2.5%" -> 2.5)
      const match = ledger.name.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[0]) : 0;
    };

    transactions.forEach(t => {
      const mName = monthNames[t.monthVal - 1];
      if (!monthlyData[mName]) {
        monthlyData[mName] = {
          purchase: {},
          cgst: {},
          sgst: {},
          igst: {},
          totalPurchase: 0,
          totalIGST: 0,
          totalCGST: 0,
          totalSGST: 0
        };
      }

      const amount = Number(t.amount || 0);

      // Note: In the user's schema, these columns hold Ledger IDs, not rates
      const cgstLedgerId = Math.round(Number(t.cgstRate || 0));
      const sgstLedgerId = Math.round(Number(t.sgstRate || 0));
      const igstLedgerId = Math.round(Number(t.igstRate || 0));

      // Purchase Aggregation
      if (t.purchaseLedgerId) {
        monthlyData[mName].purchase[t.purchaseLedgerId] = (monthlyData[mName].purchase[t.purchaseLedgerId] || 0) + amount;
        monthlyData[mName].totalPurchase += amount;
      }

      // ✅ Calculate Tax based on Ledger ID -> Name -> Rate Parsing
      if (cgstLedgerId > 0) {
        const rate = getRateFromLedger(cgstLedgerId);
        const taxAmount = amount * (rate / 100);

        if (ledgerMap.has(cgstLedgerId)) {
          monthlyData[mName].cgst[cgstLedgerId] = (monthlyData[mName].cgst[cgstLedgerId] || 0) + taxAmount;
          monthlyData[mName].totalCGST += taxAmount;
        }
      }

      if (sgstLedgerId > 0) {
        const rate = getRateFromLedger(sgstLedgerId);
        const taxAmount = amount * (rate / 100);

        if (ledgerMap.has(sgstLedgerId)) {
          monthlyData[mName].sgst[sgstLedgerId] = (monthlyData[mName].sgst[sgstLedgerId] || 0) + taxAmount;
          monthlyData[mName].totalSGST += taxAmount;
        }
      }

      if (igstLedgerId > 0) {
        const rate = getRateFromLedger(igstLedgerId);
        const taxAmount = amount * (rate / 100);

        if (ledgerMap.has(igstLedgerId)) {
          monthlyData[mName].igst[igstLedgerId] = (monthlyData[mName].igst[igstLedgerId] || 0) + taxAmount;
          monthlyData[mName].totalIGST += taxAmount;
        }
      }
    });


    return res.json({
      success: true,
      data: {
        ledgers: ledgers,
        monthlyData: monthlyData
      }
    });

  } catch (error) {

    console.error("Purchase GST error:", error);

    res.status(500).json({
      success: false,
      message: "Database error",
    });

  }
});



router.get("/sales", async (req, res) => {
  try {

    const { company_id, owner_type, owner_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }


    // ✅ Fetch All Related Ledgers
    const [rows] = await db.execute(
      `
      SELECT id, name
      FROM ledgers
      WHERE company_id = ?
        AND owner_type = ?
        AND (owner_id = ? OR owner_id = 0)
        AND (
          LOWER(name) LIKE '%sales%'
          OR LOWER(name) LIKE '%igst%'
          OR LOWER(name) LIKE '%cgst%'
          OR LOWER(name) LIKE '%sgst%'
        )
      ORDER BY name
      `,
      [company_id, owner_type, owner_id]
    );


    // ✅ Group Data
    const ledgers = {
      sales: [],
      igst: [],
      cgst: [],
      sgst: []
    };


    rows.forEach((row) => {

      const name = row.name.toLowerCase();

      if (name.includes("sales")) {
        ledgers.sales.push(row);
      }

      else if (name.includes("igst")) {
        ledgers.igst.push(row);
      }

      else if (name.includes("cgst")) {
        ledgers.cgst.push(row);
      }

      else if (name.includes("sgst")) {
        ledgers.sgst.push(row);
      }

    });

    // ✅ Fetch Transactions
    const [transactions] = await db.execute(`
      SELECT
        MONTH(v.date) as monthVal,
        i.salesLedgerId,
        i.amount,
        i.cgstRate,
        i.sgstRate,
        i.igstRate
      FROM sales_vouchers v
      JOIN sales_voucher_items i ON v.id = i.voucherId
      WHERE v.company_id = ? 
        AND v.owner_type = ? 
        AND v.owner_id = ?
    `, [company_id, owner_type, owner_id]);

    // ✅ Aggregate Data
    const monthlyData = {};

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // ✅ Create Ledger Map for ID Lookup
    const ledgerMap = new Map();
    rows.forEach(r => ledgerMap.set(r.id, r));

    // ✅ Helper to extract rate from ledger name
    const getRateFromLedger = (ledgerId) => {
      const ledger = ledgerMap.get(ledgerId);
      if (!ledger) return 0;

      // Extract numbers from string (e.g. "Input CGST 9%" -> 9, "SGST @ 2.5%" -> 2.5)
      const match = ledger.name.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[0]) : 0;
    };

    transactions.forEach(t => {
      const mName = monthNames[t.monthVal - 1];
      if (!monthlyData[mName]) {
        monthlyData[mName] = {
          sales: {},
          cgst: {},
          sgst: {},
          igst: {},
          totalSales: 0,
          totalIGST: 0,
          totalCGST: 0,
          totalSGST: 0
        };
      }

      const amount = Number(t.amount || 0);

      // Note: In the user's schema, these columns hold Ledger IDs, not rates
      const cgstLedgerId = Math.round(Number(t.cgstRate || 0));
      const sgstLedgerId = Math.round(Number(t.sgstRate || 0));
      const igstLedgerId = Math.round(Number(t.igstRate || 0));

      // Sales Aggregation
      if (t.salesLedgerId) {
        monthlyData[mName].sales[t.salesLedgerId] = (monthlyData[mName].sales[t.salesLedgerId] || 0) + amount;
        monthlyData[mName].totalSales += amount;
      }

      // ✅ Calculate Tax based on Ledger ID -> Name -> Rate Parsing
      if (cgstLedgerId > 0) {
        const rate = getRateFromLedger(cgstLedgerId);
        const taxAmount = amount * (rate / 100);

        if (ledgerMap.has(cgstLedgerId)) {
          monthlyData[mName].cgst[cgstLedgerId] = (monthlyData[mName].cgst[cgstLedgerId] || 0) + taxAmount;
          monthlyData[mName].totalCGST += taxAmount;
        }
      }

      if (sgstLedgerId > 0) {
        const rate = getRateFromLedger(sgstLedgerId);
        const taxAmount = amount * (rate / 100);

        if (ledgerMap.has(sgstLedgerId)) {
          monthlyData[mName].sgst[sgstLedgerId] = (monthlyData[mName].sgst[sgstLedgerId] || 0) + taxAmount;
          monthlyData[mName].totalSGST += taxAmount;
        }
      }

      if (igstLedgerId > 0) {
        const rate = getRateFromLedger(igstLedgerId);
        const taxAmount = amount * (rate / 100);

        if (ledgerMap.has(igstLedgerId)) {
          monthlyData[mName].igst[igstLedgerId] = (monthlyData[mName].igst[igstLedgerId] || 0) + taxAmount;
          monthlyData[mName].totalIGST += taxAmount;
        }
      }
    });


    return res.json({
      success: true,
      data: {
        ledgers: ledgers,
        monthlyData: monthlyData
      }
    });

  } catch (error) {

    console.error("Sales GST error:", error);

    res.status(500).json({
      success: false,
      message: "Database error",
    });

  }
});









// router.get("/debit-notes", async (req, res) => {
//   try {
//     const { company_id, owner_type, owner_id } = req.query;
//     console.log("debit notes route hit");

//     const GST_RATES = ["0%", "3%", "5%", "12%", "18%", "28%"];


//     if (!company_id || !owner_type || !owner_id) {
//       return res.status(400).json({
//         success: false,
//         message: "company_id, owner_type and owner_id are required",
//       });
//     }

//     /* 🔹 COMPANY STATE */
//     const [companyRows] = await db.query(
//       `SELECT state FROM tbcompanies WHERE id = ?`,
//       [company_id]
//     );

//     const companyStateCode =
//       companyRows[0]?.state?.match(/\((\d+)\)/)?.[1] || "";

//     /* 🔹 FETCH ALL LEDGERS (for GST % detection) */
//     const [ledgerRows] = await db.query(`
//       SELECT id, LOWER(name) AS name
//       FROM ledgers
//     `);

//     const ledgerMap = {};
//     ledgerRows.forEach(l => {
//       ledgerMap[l.id] = l.name;
//     });

//     /* 🔹 DEBIT NOTES */
//     const [rows] = await db.query(
//       `
//       SELECT
//         MONTH(dnv.date) AS month,
//         dnv.narration,
//         sl.state AS partyState
//       FROM debit_note_vouchers dnv
//       LEFT JOIN ledgers sl ON sl.id = dnv.party_id
//       WHERE dnv.company_id = ?
//         AND dnv.owner_type = ?
//         AND dnv.owner_id = ?
//       `,
//       [company_id, owner_type, owner_id]
//     );

//     const result = [];

//     for (const r of rows) {
//       let narration;
//       try {
//         narration = JSON.parse(r.narration || "{}");
//       } catch {
//         continue;
//       }

//       const entries = narration.accountingEntries || [];

//       for (const e of entries) {
//         if (e.type !== "debit") continue;

//         const ledgerName = ledgerMap[e.ledgerId] || "";

//         const gstRate = GST_RATES.find(rate =>
//           ledgerName.includes(rate)
//         );

//         if (!gstRate) continue;

//         const partyStateCode =
//           r.partyState?.match(/\((\d+)\)/)?.[1] || "";

//         result.push({
//           ledgerName: `${gstRate} debit notes`,
//           month: r.month,
//           total: Number(e.amount || 0),
//           supplyType:
//             partyStateCode === companyStateCode ? "INTRA" : "INTER",
//         });
//       }
//     }

//     res.json({
//       success: true,
//       data: result,
//     });

//   } catch (error) {
//     console.error("Debit note GST error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Database error",
//     });
//   }
// });



// router.get("/credit-notes", async (req, res) => {
//   try {
//     const { company_id, owner_type, owner_id } = req.query;
//     console.log("credit notes route hit");

//     const GST_RATES = ["0%", "3%", "5%", "12%", "18%", "28%"];

//     if (!company_id || !owner_type || !owner_id) {
//       return res.status(400).json({
//         success: false,
//         message: "company_id, owner_type and owner_id are required",
//       });
//     }

//     /* 🔹 COMPANY STATE */
//     const [companyRows] = await db.query(
//       `SELECT state FROM tbcompanies WHERE id = ?`,
//       [company_id]
//     );

//     const companyStateCode =
//       companyRows[0]?.state?.match(/\((\d+)\)/)?.[1] || "";

//     /* 🔹 LEDGERS */
//     const [ledgerRows] = await db.query(`
//       SELECT id, LOWER(name) AS name
//       FROM ledgers
//     `);

//     const ledgerMap = {};
//     ledgerRows.forEach(l => {
//       ledgerMap[l.id] = l.name;
//     });

//     /* 🔹 CREDIT NOTES (correct table) */
//     const [rows] = await db.query(
//       `
//       SELECT
//         MONTH(cnv.date) AS month,
//         cnv.narration,
//         sl.state AS partyState
//       FROM credit_vouchers cnv
//       LEFT JOIN ledgers sl ON sl.id = cnv.partyId
//       WHERE cnv.company_id = ?
//         AND cnv.owner_type = ?
//         AND cnv.owner_id = ?
//       `,
//       [company_id, owner_type, owner_id]
//     );

//     const result = [];

//     for (const r of rows) {
//       let narration;
//       try {
//         narration = JSON.parse(r.narration || "{}");
//       } catch {
//         continue;
//       }

//       const entries = narration.accountingEntries || [];

//       for (const e of entries) {
//         // ✅ GST LEDGER IS ALWAYS DEBIT
//         if (e.type !== "debit") continue;

//         const ledgerName = ledgerMap[e.ledgerId] || "";

//         const gstRate = GST_RATES.find(rate =>
//           ledgerName.includes(rate)
//         );

//         if (!gstRate) continue;

//         const partyStateCode =
//           r.partyState?.match(/\((\d+)\)/)?.[1] || "";

//         let supplyType = "UNKNOWN";
//         if (partyStateCode && companyStateCode) {
//           supplyType =
//             partyStateCode === companyStateCode ? "INTRA" : "INTER";
//         }

//         result.push({
//           ledgerName: `${gstRate} credit notes`,
//           month: r.month,
//           total: Number(e.amount || 0),
//           supplyType,
//         });
//       }
//     }

//     res.json({
//       success: true,
//       data: result,
//     });

//   } catch (error) {
//     console.error("Credit note GST error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Database error",
//     });
//   }
// });












module.exports = router;
