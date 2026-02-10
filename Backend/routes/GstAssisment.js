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




module.exports = router;
