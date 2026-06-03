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


router.get("/trading-account", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }

    // 1. Fetch all ledgers to build rate extractor
    const [ledgers] = await db.execute(
      `SELECT id, name, group_id, opening_balance, balance_type 
       FROM ledgers 
       WHERE company_id = ? AND owner_type = ? AND (owner_id = ? OR owner_id = 0)`,
      [company_id, owner_type, owner_id]
    );

    const ledgerMap = new Map();
    ledgers.forEach(l => ledgerMap.set(l.id, l));

    const getRateFromLedger = (ledgerId) => {
      if (!ledgerId) return 0;
      const ledger = ledgerMap.get(Number(ledgerId));
      if (!ledger) {
        if (Number(ledgerId) < 100) return Number(ledgerId);
        return 0;
      }
      const match = ledger.name.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[0]) : 0;
    };

    // Fetch all stock groups for this company/owner
    const [stockGroups] = await db.execute(
      `SELECT id, name FROM stock_groups WHERE company_id = ? AND owner_type = ? AND owner_id = ?`,
      [company_id, owner_type, owner_id]
    );
    const stockGroupMap = {};
    stockGroups.forEach(g => {
      stockGroupMap[g.id] = g.name;
    });

    // 2. Fetch stock items (using SQL fallback aliases to avoid runtime DDL/ALTER TABLE)
    const [stockItems] = await db.execute(
      `SELECT id, name, NULL AS stockGroupId, 0.00 AS openingBalance, 0.00 AS openingValue, 0.00 AS gstRate, batches, 0.00 AS openingRate, 0.00 AS standardPurchaseRate 
       FROM stock_items 
       WHERE company_id = ? AND owner_type = ? AND owner_id = ?`,
      [company_id, owner_type, owner_id]
    );

    // 3. Compute Opening Stock grouped by GST Rate
    const openingStockByRate = {};
    const openingStockByRateAndGroup = {}; // rate -> { groupName -> val }
    const openingStockByRateAndItem = {}; // rate -> { itemName -> val }
    stockItems.forEach(item => {
      const rate = Number(item.gstRate || 0);
      const groupId = item.stockGroupId;
      const groupName = stockGroupMap[groupId] || "Primary";
      const itemName = item.name;

      let val = 0;
      let batches = [];
      try {
        batches = item.batches ? JSON.parse(item.batches) : [];
      } catch (e) {}

      if (batches && batches.length > 0) {
        batches.forEach(b => {
          val += (Number(b.batchQuantity) || 0) * (Number(b.openingRate) || 0);
        });
      } else {
        val += (Number(item.openingBalance) || 0) * (Number(item.openingRate || item.standardPurchaseRate || 0) || 0);
      }
      openingStockByRate[rate] = (openingStockByRate[rate] || 0) + val;

      if (!openingStockByRateAndGroup[rate]) {
        openingStockByRateAndGroup[rate] = {};
      }
      openingStockByRateAndGroup[rate][groupName] = (openingStockByRateAndGroup[rate][groupName] || 0) + val;

      if (!openingStockByRateAndItem[rate]) {
        openingStockByRateAndItem[rate] = {};
      }
      openingStockByRateAndItem[rate][itemName] = (openingStockByRateAndItem[rate][itemName] || 0) + val;
    });

    // 4. Compute Closing Stock grouped by GST Rate using Tally's standard average cost
    const [purchaseHistory] = await db.execute(
      `SELECT i.itemId, i.quantity AS purchaseQuantity, i.rate, i.amount
       FROM purchase_voucher_items i
       JOIN purchase_vouchers v ON i.voucherId = v.id
       WHERE v.company_id = ? AND v.owner_type = ? AND v.owner_id = ?`,
      [company_id, owner_type, owner_id]
    );

    const [salesHistory] = await db.execute(
      `SELECT i.itemId, i.quantity AS qtyChange
       FROM sales_voucher_items i
       JOIN sales_vouchers v ON i.voucherId = v.id
       WHERE v.company_id = ? AND v.owner_type = ? AND v.owner_id = ?`,
      [company_id, owner_type, owner_id]
    );

    const itemMap = {};
    stockItems.forEach(item => {
      const itemId = item.id;
      itemMap[itemId] = {
        name: item.name,
        gstRate: Number(item.gstRate || 0),
        groupName: stockGroupMap[item.stockGroupId] || "Primary",
        openingQty: 0,
        openingValue: 0,
        inwardQty: 0,
        inwardValue: 0,
        outwardQty: 0
      };

      let batches = [];
      try {
        batches = item.batches ? JSON.parse(item.batches) : [];
      } catch (e) {}

      if (batches && batches.length > 0) {
        batches.forEach(b => {
          const q = Number(b.batchQuantity || 0);
          const r = Number(b.openingRate || 0);
          itemMap[itemId].openingQty += q;
          itemMap[itemId].openingValue += q * r;
        });
      } else {
        const q = Number(item.openingBalance || 0);
        const r = Number(item.openingRate || item.standardPurchaseRate || 0);
        itemMap[itemId].openingQty += q;
        itemMap[itemId].openingValue += q * r;
      }
    });

    purchaseHistory.forEach(p => {
      const itemId = p.itemId;
      if (!itemMap[itemId]) return;
      const q = Number(p.purchaseQuantity || 0);
      const v = q * Number(p.rate || 0);
      itemMap[itemId].inwardQty += q;
      itemMap[itemId].inwardValue += v;
    });

    salesHistory.forEach(s => {
      const itemId = s.itemId;
      if (!itemMap[itemId]) return;
      const q = Math.abs(Number(s.qtyChange || 0));
      itemMap[itemId].outwardQty += q;
    });

    const closingStockByRate = {};
    const closingStockByRateAndGroup = {}; // rate -> { groupName -> val }
    const closingStockByRateAndItem = {}; // rate -> { itemName -> val }
    Object.values(itemMap).forEach(item => {
      const rate = item.gstRate;
      const groupName = item.groupName;
      const itemName = item.name;
      const totalInQty = item.openingQty + item.inwardQty;
      const totalInValue = item.openingValue + item.inwardValue;
      const avgRate = totalInQty > 0 ? totalInValue / totalInQty : 0;
      const closingQty = totalInQty - item.outwardQty;
      const closingValue = closingQty * avgRate;

      const finalClosingVal = Math.max(0, closingValue);
      closingStockByRate[rate] = (closingStockByRate[rate] || 0) + finalClosingVal;

      if (!closingStockByRateAndGroup[rate]) {
        closingStockByRateAndGroup[rate] = {};
      }
      closingStockByRateAndGroup[rate][groupName] = (closingStockByRateAndGroup[rate][groupName] || 0) + finalClosingVal;

      if (!closingStockByRateAndItem[rate]) {
        closingStockByRateAndItem[rate] = {};
      }
      closingStockByRateAndItem[rate][itemName] = (closingStockByRateAndItem[rate][itemName] || 0) + finalClosingVal;
    });

    // 5. Compute Purchases by GST Rate
    const [purchaseItems] = await db.execute(
      `SELECT i.amount, i.cgstRate, i.sgstRate, i.igstRate, 0.00 AS itemGstRate
       FROM purchase_voucher_items i
       JOIN purchase_vouchers v ON i.voucherId = v.id
       LEFT JOIN stock_items s ON i.itemId = s.id
       WHERE v.company_id = ? AND v.owner_type = ? AND v.owner_id = ?`,
      [company_id, owner_type, owner_id]
    );

    const purchaseByRate = {};
    purchaseItems.forEach(item => {
      const cgst = getRateFromLedger(item.cgstRate);
      const sgst = getRateFromLedger(item.sgstRate);
      const igst = getRateFromLedger(item.igstRate);
      
      let rate = igst > 0 ? igst : (cgst + sgst);
      if (rate === 0) {
        rate = Number(item.itemGstRate || 0);
      }
      const amt = Number(item.amount || 0);
      purchaseByRate[rate] = (purchaseByRate[rate] || 0) + amt;
    });

    // 6. Compute Sales by GST Rate
    const [salesItems] = await db.execute(
      `SELECT i.amount, i.cgstRate, i.sgstRate, i.igstRate, 0.00 AS itemGstRate
       FROM sales_voucher_items i
       JOIN sales_vouchers v ON i.voucherId = v.id
       LEFT JOIN stock_items s ON i.itemId = s.id
       WHERE v.company_id = ? AND v.owner_type = ? AND v.owner_id = ?`,
      [company_id, owner_type, owner_id]
    );

    const salesByRate = {};
    salesItems.forEach(item => {
      const cgst = getRateFromLedger(item.cgstRate);
      const sgst = getRateFromLedger(item.sgstRate);
      const igst = getRateFromLedger(item.igstRate);
      
      let rate = igst > 0 ? igst : (cgst + sgst);
      if (rate === 0) {
        rate = Number(item.itemGstRate || 0);
      }
      const amt = Number(item.amount || 0);
      salesByRate[rate] = (salesByRate[rate] || 0) + amt;
    });

    // 7. Compute Direct Expenses by GST Rate
    const [groups] = await db.execute(`SELECT id, name, parent FROM ledger_groups`);
    const directGroups = new Set([-7]);
    let added = true;
    while (added) {
      added = false;
      groups.forEach(g => {
        if (g.parent && directGroups.has(Number(g.parent)) && !directGroups.has(g.id)) {
          directGroups.add(g.id);
          added = true;
        }
      });
    }

    const directLedgers = ledgers.filter(l => directGroups.has(Number(l.group_id)));
    const directExpensesByRate = {};
    let commonExpenses = 0;

    for (const ledger of directLedgers) {
      const [entries] = await db.execute(
        `SELECT 
           SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE -amount END) AS balance
         FROM voucher_entries ve
         JOIN vouchers v ON ve.voucher_id = v.id
         WHERE ve.ledger_id = ? AND v.company_id = ? AND v.owner_type = ? AND v.owner_id = ?`,
        [ledger.id, company_id, owner_type, owner_id]
      );
      
      const balance = Number(entries[0]?.balance || 0) + Number(ledger.opening_balance || 0);
      if (balance === 0) continue;

      const match = ledger.name.match(/(\d+(\.\d+)?)/);
      if (match) {
        const rate = parseFloat(match[0]);
        directExpensesByRate[rate] = (directExpensesByRate[rate] || 0) + balance;
      } else {
        commonExpenses += balance;
      }
    }

    const totalPurchase = Object.values(purchaseByRate).reduce((a, b) => a + b, 0);
    if (commonExpenses > 0) {
      if (totalPurchase > 0) {
        Object.keys(purchaseByRate).forEach(rateStr => {
          const rate = parseFloat(rateStr);
          const pct = purchaseByRate[rate] / totalPurchase;
          directExpensesByRate[rate] = (directExpensesByRate[rate] || 0) + (commonExpenses * pct);
        });
      } else {
        directExpensesByRate[0] = (directExpensesByRate[0] || 0) + commonExpenses;
      }
    }

    // 8. Collect all GST rates
    const allRatesSet = new Set([
      ...Object.keys(openingStockByRate).map(Number),
      ...Object.keys(purchaseByRate).map(Number),
      ...Object.keys(salesByRate).map(Number),
      ...Object.keys(closingStockByRate).map(Number),
      ...Object.keys(directExpensesByRate).map(Number)
    ]);
    const rates = Array.from(allRatesSet).sort((a, b) => a - b);

    // Build the final response list
    const tradingAccount = rates.map(rate => {
      const openingStock = openingStockByRate[rate] || 0;
      const purchase = purchaseByRate[rate] || 0;
      const directExpense = directExpensesByRate[rate] || 0;
      const sales = salesByRate[rate] || 0;
      const closingStock = closingStockByRate[rate] || 0;

      const totalDebits = openingStock + purchase + directExpense;
      const totalCredits = sales + closingStock;
      const grossProfit = totalCredits - totalDebits;

      return {
        gstRate: rate,
        openingStock,
        openingStockByGroup: openingStockByRateAndGroup[rate] || {},
        openingStockByItem: openingStockByRateAndItem[rate] || {},
        purchase,
        directExpense,
        sales,
        closingStock,
        closingStockByGroup: closingStockByRateAndGroup[rate] || {},
        closingStockByItem: closingStockByRateAndItem[rate] || {},
        grossProfit
      };
    });

    res.json({
      success: true,
      data: tradingAccount
    });

  } catch (error) {
    console.error("Trading Account GST Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});


module.exports = router;

