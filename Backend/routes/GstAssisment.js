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

    // ================================
    // FETCH ALL RELATED LEDGERS
    // ================================
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
          OR LOWER(name) LIKE '%intra%'
          OR LOWER(name) LIKE '%inter%'
        )
      ORDER BY name
      `,
      [company_id, owner_type, owner_id]
    );

    // ================================
    // GROUP LEDGERS
    // ================================
    const ledgers = {
      intraPurchase: [],
      interPurchase: [],
      igst: [],
      cgst: [],
      sgst: []
    };


    rows.forEach((row) => {

      const name = row.name.toLowerCase();

      // Intra Purchase
      if (name.includes("purchase") && name.includes("intra")) {
        ledgers.intraPurchase.push(row);
      }

      // Inter Purchase
      else if (name.includes("purchase") && name.includes("inter")) {
        ledgers.interPurchase.push(row);
      }

      // Taxes
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

    // ================================
    // FETCH TRANSACTIONS
    // ================================
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

    // ================================
    // MONTH CONFIG
    // ================================
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlyData = {};

    // ================================
    // LEDGER MAP
    // ================================
    const ledgerMap = new Map();
    rows.forEach(r => ledgerMap.set(r.id, r));

    // ================================
    // RATE EXTRACTOR
    // ================================
    const getRateFromLedger = (ledgerId) => {

      const ledger = ledgerMap.get(ledgerId);

      if (!ledger) return 0;

      // 18% , 2.5% , 28.00%
      const match = ledger.name.match(/(\d+(\.\d+)?)/);

      return match ? parseFloat(match[0]) : 0;
    };

    // ================================
    // PROCESS TRANSACTIONS
    // ================================
    transactions.forEach(t => {

      const mName = monthNames[t.monthVal - 1];

      if (!monthlyData[mName]) {
        monthlyData[mName] = {
          intraPurchase: {},
          interPurchase: {},
          cgst: {},
          sgst: {},
          igst: {},

          totalIntraPurchase: 0,
          totalInterPurchase: 0,

          totalCGST: 0,
          totalSGST: 0,
          totalIGST: 0
        };
      }

      const amount = Number(t.amount || 0);

      const purchaseLedgerId = t.purchaseLedgerId;

      const cgstLedgerId = Math.round(Number(t.cgstRate || 0));
      const sgstLedgerId = Math.round(Number(t.sgstRate || 0));
      const igstLedgerId = Math.round(Number(t.igstRate || 0));

      const purchaseLedger = ledgerMap.get(purchaseLedgerId);

      const purchaseName = purchaseLedger?.name?.toLowerCase() || "";

      // ================================
      // PURCHASE TYPE
      // ================================

      // INTRA
      if (purchaseName.includes("intra")) {

        monthlyData[mName].intraPurchase[purchaseLedgerId] =
          (monthlyData[mName].intraPurchase[purchaseLedgerId] || 0) + amount;

        monthlyData[mName].totalIntraPurchase += amount;
      }

      // INTER
      else if (purchaseName.includes("inter")) {

        monthlyData[mName].interPurchase[purchaseLedgerId] =
          (monthlyData[mName].interPurchase[purchaseLedgerId] || 0) + amount;

        monthlyData[mName].totalInterPurchase += amount;
      }

      // ================================
      // TAX CALCULATION
      // ================================

      // CGST
      if (cgstLedgerId > 0) {

        const rate = getRateFromLedger(cgstLedgerId);

        const tax = amount * (rate / 100);

        if (ledgerMap.has(cgstLedgerId)) {

          monthlyData[mName].cgst[cgstLedgerId] =
            (monthlyData[mName].cgst[cgstLedgerId] || 0) + tax;

          monthlyData[mName].totalCGST += tax;
        }
      }

      // SGST
      if (sgstLedgerId > 0) {

        const rate = getRateFromLedger(sgstLedgerId);

        const tax = amount * (rate / 100);

        if (ledgerMap.has(sgstLedgerId)) {

          monthlyData[mName].sgst[sgstLedgerId] =
            (monthlyData[mName].sgst[cgstLedgerId] || 0) + tax;

          monthlyData[mName].totalSGST += tax;
        }
      }

      // IGST
      if (igstLedgerId > 0) {

        const rate = getRateFromLedger(igstLedgerId);

        const tax = amount * (rate / 100);

        if (ledgerMap.has(igstLedgerId)) {

          monthlyData[mName].igst[igstLedgerId] =
            (monthlyData[mName].igst[igstLedgerId] || 0) + tax;

          monthlyData[mName].totalIGST += tax;
        }
      }

    });


    // ================================
    // RESPONSE
    // ================================
    return res.json({
      success: true,
      data: {
        ledgers,
        monthlyData
      }
    });

  } catch (error) {

    console.error("Purchase GST Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error"
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

    // ================================
    // FETCH ALL RELATED LEDGERS
    // ================================
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
          OR LOWER(name) LIKE '%intra%'
          OR LOWER(name) LIKE '%inter%'
        )
      ORDER BY name
      `,
      [company_id, owner_type, owner_id]
    );

    // ================================
    // GROUP LEDGERS
    // ================================
    const ledgers = {
      intraSales: [],
      interSales: [],
      igst: [],
      cgst: [],
      sgst: []
    };

    rows.forEach((row) => {

      const name = row.name.toLowerCase();

      // Intra Sales
      if (name.includes("sales") && name.includes("intra")) {
        ledgers.intraSales.push(row);
      }

      // Inter Sales
      else if (name.includes("sales") && name.includes("inter")) {
        ledgers.interSales.push(row);
      }

      // Taxes
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

    // ================================
    // FETCH TRANSACTIONS
    // ================================
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

    // ================================
    // MONTH CONFIG
    // ================================
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlyData = {};

    // ================================
    // LEDGER MAP
    // ================================
    const ledgerMap = new Map();
    rows.forEach(r => ledgerMap.set(r.id, r));

    // ================================
    // RATE EXTRACTOR
    // ================================
    const getRateFromLedger = (ledgerId) => {

      const ledger = ledgerMap.get(ledgerId);

      if (!ledger) return 0;

      // 18% , 2.5% , 28%
      const match = ledger.name.match(/(\d+(\.\d+)?)/);

      return match ? parseFloat(match[0]) : 0;
    };

    // ================================
    // PROCESS TRANSACTIONS
    // ================================
    transactions.forEach(t => {

      const mName = monthNames[t.monthVal - 1];

      if (!monthlyData[mName]) {
        monthlyData[mName] = {

          intraSales: {},
          interSales: {},

          cgst: {},
          sgst: {},
          igst: {},

          totalIntraSales: 0,
          totalInterSales: 0,

          totalCGST: 0,
          totalSGST: 0,
          totalIGST: 0
        };
      }

      const amount = Number(t.amount || 0);

      const salesLedgerId = t.salesLedgerId;

      const cgstLedgerId = Math.round(Number(t.cgstRate || 0));
      const sgstLedgerId = Math.round(Number(t.sgstRate || 0));
      const igstLedgerId = Math.round(Number(t.igstRate || 0));

      const salesLedger = ledgerMap.get(salesLedgerId);

      const salesName = salesLedger?.name?.toLowerCase() || "";

      // ================================
      // SALES TYPE
      // ================================

      // INTRA
      if (salesName.includes("intra")) {

        monthlyData[mName].intraSales[salesLedgerId] =
          (monthlyData[mName].intraSales[salesLedgerId] || 0) + amount;

        monthlyData[mName].totalIntraSales += amount;
      }

      // INTER
      else if (salesName.includes("inter")) {

        monthlyData[mName].interSales[salesLedgerId] =
          (monthlyData[mName].interSales[salesLedgerId] || 0) + amount;

        monthlyData[mName].totalInterSales += amount;
      }

      // ================================
      // TAX CALCULATION
      // ================================

      // CGST
      if (cgstLedgerId > 0) {

        const rate = getRateFromLedger(cgstLedgerId);

        const tax = amount * (rate / 100);

        if (ledgerMap.has(cgstLedgerId)) {

          monthlyData[mName].cgst[cgstLedgerId] =
            (monthlyData[mName].cgst[cgstLedgerId] || 0) + tax;

          monthlyData[mName].totalCGST += tax;
        }
      }

      // SGST
      if (sgstLedgerId > 0) {

        const rate = getRateFromLedger(sgstLedgerId);

        const tax = amount * (rate / 100);

        if (ledgerMap.has(sgstLedgerId)) {

          monthlyData[mName].sgst[sgstLedgerId] =
            (monthlyData[mName].sgst[sgstLedgerId] || 0) + tax;

          monthlyData[mName].totalSGST += tax;
        }
      }

      // IGST
      if (igstLedgerId > 0) {

        const rate = getRateFromLedger(igstLedgerId);

        const tax = amount * (rate / 100);

        if (ledgerMap.has(igstLedgerId)) {

          monthlyData[mName].igst[igstLedgerId] =
            (monthlyData[mName].igst[igstLedgerId] || 0) + tax;

          monthlyData[mName].totalIGST += tax;
        }
      }

    });

    // ================================
    // RESPONSE
    // ================================
    return res.json({
      success: true,
      data: {
        ledgers,
        monthlyData
      }
    });

  } catch (error) {

    console.error("Sales GST Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});


router.get("/credit-note", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }

    // ================================
    // FETCH ALL RELATED LEDGERS
    // ================================
    const [rows] = await db.execute(
      `
      SELECT id, name
      FROM ledgers
      WHERE company_id = ?
        AND owner_type = ?
        AND (owner_id = ? OR owner_id = 0)
        AND (
          LOWER(name) LIKE '%sales%'
          OR LOWER(name) LIKE '%credit%'
          OR LOWER(name) LIKE '%igst%'
          OR LOWER(name) LIKE '%cgst%'
          OR LOWER(name) LIKE '%sgst%'
          OR LOWER(name) LIKE '%intra%'
          OR LOWER(name) LIKE '%inter%'
        )
      ORDER BY name
      `,
      [company_id, owner_type, owner_id]
    );

    // ================================
    // GROUP LEDGERS
    // ================================
    const ledgers = {
      intraSales: [],
      interSales: [],
      igst: [],
      cgst: [],
      sgst: []
    };

    rows.forEach((row) => {
      const name = row.name.toLowerCase();

      // Intra Sales
      if ((name.includes("sales") || name.includes("credit")) && name.includes("intra")) {
        ledgers.intraSales.push(row);
      }
      // Inter Sales
      else if ((name.includes("sales") || name.includes("credit")) && name.includes("inter")) {
        ledgers.interSales.push(row);
      }
      // Taxes
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

    // ================================
    // FETCH VOUCHERS
    // ================================
    const [vouchers] = await db.execute(
      `
      SELECT id, date, narration
      FROM credit_vouchers
      WHERE company_id = ?
        AND owner_type = ?
        AND owner_id = ?
      `,
      [company_id, owner_type, owner_id]
    );

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlyData = {};
    const ledgerMap = new Map();
    rows.forEach(r => ledgerMap.set(r.id, r));

    vouchers.forEach((v) => {
      let monthVal = null;
      if (v.date) {
        const d = new Date(v.date);
        if (!isNaN(d.getTime())) {
          monthVal = d.getMonth() + 1;
        }
      }
      if (!monthVal) return;

      const mName = monthNames[monthVal - 1];

      if (!monthlyData[mName]) {
        monthlyData[mName] = {
          intraSales: {},
          interSales: {},
          cgst: {},
          sgst: {},
          igst: {},
          totalIntraSales: 0,
          totalInterSales: 0,
          totalCGST: 0,
          totalSGST: 0,
          totalIGST: 0
        };
      }

      let entries = [];
      if (v.narration) {
        try {
          const parsed = JSON.parse(v.narration);
          entries = parsed.accountingEntries || [];
        } catch (err) {
          // not JSON, ignore
        }
      }

      entries.forEach((e) => {
        const ledgerId = Number(e.ledgerId);
        const amount = Number(e.amount || 0);
        if (!ledgerId || amount <= 0) return;

        const ledger = ledgerMap.get(ledgerId);
        if (!ledger) return;

        const ledgerName = ledger.name.toLowerCase();

        // 1. Check if it's Intra Sales
        if (ledgerName.includes("intra") && (ledgerName.includes("sales") || ledgerName.includes("credit"))) {
          monthlyData[mName].intraSales[ledgerId] =
            (monthlyData[mName].intraSales[ledgerId] || 0) + amount;
          monthlyData[mName].totalIntraSales += amount;
        }
        // 2. Check if it's Inter Sales
        else if (ledgerName.includes("inter") && (ledgerName.includes("sales") || ledgerName.includes("credit"))) {
          monthlyData[mName].interSales[ledgerId] =
            (monthlyData[mName].interSales[ledgerId] || 0) + amount;
          monthlyData[mName].totalInterSales += amount;
        }
        // 3. Check if it's CGST
        else if (ledgerName.includes("cgst")) {
          monthlyData[mName].cgst[ledgerId] =
            (monthlyData[mName].cgst[ledgerId] || 0) + amount;
          monthlyData[mName].totalCGST += amount;
        }
        // 4. Check if it's SGST
        else if (ledgerName.includes("sgst")) {
          monthlyData[mName].sgst[ledgerId] =
            (monthlyData[mName].sgst[ledgerId] || 0) + amount;
          monthlyData[mName].totalSGST += amount;
        }
        // 5. Check if it's IGST
        else if (ledgerName.includes("igst")) {
          monthlyData[mName].igst[ledgerId] =
            (monthlyData[mName].igst[ledgerId] || 0) + amount;
          monthlyData[mName].totalIGST += amount;
        }
      });
    });

    return res.json({
      success: true,
      data: {
        ledgers,
        monthlyData
      }
    });

  } catch (error) {
    console.error("Credit Note GST Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

router.get("/debit-note", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }

    // ================================
    // FETCH ALL RELATED LEDGERS
    // ================================
    const [rows] = await db.execute(
      `
      SELECT id, name
      FROM ledgers
      WHERE company_id = ?
        AND owner_type = ?
        AND (owner_id = ? OR owner_id = 0)
        AND (
          LOWER(name) LIKE '%purchase%'
          OR LOWER(name) LIKE '%debit%'
          OR LOWER(name) LIKE '%igst%'
          OR LOWER(name) LIKE '%cgst%'
          OR LOWER(name) LIKE '%sgst%'
          OR LOWER(name) LIKE '%intra%'
          OR LOWER(name) LIKE '%inter%'
        )
      ORDER BY name
      `,
      [company_id, owner_type, owner_id]
    );

    // ================================
    // GROUP LEDGERS
    // ================================
    const ledgers = {
      intraPurchase: [],
      interPurchase: [],
      igst: [],
      cgst: [],
      sgst: []
    };

    rows.forEach((row) => {
      const name = row.name.toLowerCase();

      // Intra Purchase
      if ((name.includes("purchase") || name.includes("debit")) && name.includes("intra")) {
        ledgers.intraPurchase.push(row);
      }
      // Inter Purchase
      else if ((name.includes("purchase") || name.includes("debit")) && name.includes("inter")) {
        ledgers.interPurchase.push(row);
      }
      // Taxes
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

    // ================================
    // FETCH VOUCHERS
    // ================================
    const [vouchers] = await db.execute(
      `
      SELECT id, date, narration
      FROM debit_note_vouchers
      WHERE company_id = ?
        AND owner_type = ?
        AND owner_id = ?
      `,
      [company_id, owner_type, owner_id]
    );

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlyData = {};
    const ledgerMap = new Map();
    rows.forEach(r => ledgerMap.set(r.id, r));

    vouchers.forEach((v) => {
      let monthVal = null;
      if (v.date) {
        const d = new Date(v.date);
        if (!isNaN(d.getTime())) {
          monthVal = d.getMonth() + 1;
        }
      }
      if (!monthVal) return;

      const mName = monthNames[monthVal - 1];

      if (!monthlyData[mName]) {
        monthlyData[mName] = {
          intraPurchase: {},
          interPurchase: {},
          cgst: {},
          sgst: {},
          igst: {},
          totalIntraPurchase: 0,
          totalInterPurchase: 0,
          totalCGST: 0,
          totalSGST: 0,
          totalIGST: 0
        };
      }

      let entries = [];
      if (v.narration) {
        try {
          const parsed = JSON.parse(v.narration);
          entries = parsed.accountingEntries || [];
        } catch (err) {
          // not JSON, ignore
        }
      }

      entries.forEach((e) => {
        const ledgerId = Number(e.ledgerId);
        const amount = Number(e.amount || 0);
        if (!ledgerId || amount <= 0) return;

        const ledger = ledgerMap.get(ledgerId);
        if (!ledger) return;

        const ledgerName = ledger.name.toLowerCase();

        // 1. Check if it's Intra Purchase
        if (ledgerName.includes("intra") && (ledgerName.includes("purchase") || ledgerName.includes("debit"))) {
          monthlyData[mName].intraPurchase[ledgerId] =
            (monthlyData[mName].intraPurchase[ledgerId] || 0) + amount;
          monthlyData[mName].totalIntraPurchase += amount;
        }
        // 2. Check if it's Inter Purchase
        else if (ledgerName.includes("inter") && (ledgerName.includes("purchase") || ledgerName.includes("debit"))) {
          monthlyData[mName].interPurchase[ledgerId] =
            (monthlyData[mName].interPurchase[ledgerId] || 0) + amount;
          monthlyData[mName].totalInterPurchase += amount;
        }
        // 3. Check if it's CGST
        else if (ledgerName.includes("cgst")) {
          monthlyData[mName].cgst[ledgerId] =
            (monthlyData[mName].cgst[ledgerId] || 0) + amount;
          monthlyData[mName].totalCGST += amount;
        }
        // 4. Check if it's SGST
        else if (ledgerName.includes("sgst")) {
          monthlyData[mName].sgst[ledgerId] =
            (monthlyData[mName].sgst[ledgerId] || 0) + amount;
          monthlyData[mName].totalSGST += amount;
        }
        // 5. Check if it's IGST
        else if (ledgerName.includes("igst")) {
          monthlyData[mName].igst[ledgerId] =
            (monthlyData[mName].igst[ledgerId] || 0) + amount;
          monthlyData[mName].totalIGST += amount;
        }
      });
    });

    return res.json({
      success: true,
      data: {
        ledgers,
        monthlyData
      }
    });

  } catch (error) {
    console.error("Debit Note GST Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});


module.exports = router;

