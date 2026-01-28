const express = require('express');
const router = express.Router();
const pool = require('../db'); // your MySQL pool connection

//purchase
router.get("/api/purchase", async (req, res) => {
  try {
    // console.log("hit hua");

    const { ids, company_id, owner_id, owner_type } = req.query;

    if (!ids) {
      return res.status(400).json({ success: false, message: "IDs missing" });
    }

    // 1️⃣ Convert ids → array
    const idArray = ids.split(",").map(Number);

    // console.log("IDs:", idArray);

    // 2️⃣ SQL Query with JOIN
    const [rows] = await pool.query(
      `
      SELECT 
        pvi.purchaseLedgerId,
        SUM(pv.subtotal) AS totalSubtotal
      FROM purchase_voucher_items pvi

      JOIN purchase_vouchers pv
        ON pvi.voucherId = pv.id

      WHERE pvi.purchaseLedgerId IN (?)
        AND pv.company_id = ?
        AND pv.owner_type = ?
        AND pv.owner_id = ?

      GROUP BY pvi.purchaseLedgerId
      `,
      [idArray, company_id, owner_type, owner_id]
    );

    // 3️⃣ Result ko map me convert karo
    const result = {};

    rows.forEach((row) => {
      result[row.purchaseLedgerId] = row.totalSubtotal;
    });


    // console.log(result);

    // 4️⃣ Send to frontend
    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.log("Purchase API Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

//sales

router.get("/api/sales", async (req, res) => {
  try {

    // console.log("Sales API hit ✅");

    const { ids, company_id, owner_id, owner_type } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: "IDs missing",
      });
    }

    const idArray = ids.split(",").map(Number);

    const [rows] = await pool.query(
      `
      SELECT 
        svi.salesLedgerId,
        SUM(sv.subtotal) AS totalSubtotal
      FROM sales_voucher_items svi

      JOIN sales_vouchers sv
        ON svi.voucherId = sv.id

      WHERE svi.salesLedgerId IN (?)
        AND sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?

      GROUP BY svi.salesLedgerId
      `,
      [idArray, company_id, owner_type, owner_id]
    );

    const result = {};

    rows.forEach((row) => {
      result[row.salesLedgerId] = row.totalSubtotal;
    });

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.log("Sales API Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


//purchase:id
router.get("/api/purchase/:id", async (req, res) => {
  try {

    const { id } = req.params;
    const { company_id, owner_id, owner_type } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID missing",
      });
    }

    const idArray = id.split(",").map(Number);

    const [rows] = await pool.query(
      `
      SELECT 
        MONTH(pv.date) AS monthNo,
        SUM(pv.subtotal) AS total

      FROM purchase_voucher_items pvi

      JOIN purchase_vouchers pv
        ON pvi.voucherId = pv.id

      WHERE pvi.purchaseLedgerId IN (?)
        AND pv.company_id = ?
        AND pv.owner_type = ?
        AND pv.owner_id = ?

      GROUP BY MONTH(pv.date)

      ORDER BY MONTH(pv.date)
      `,
      [idArray, company_id, owner_type, owner_id]
    );

    res.json({
      success: true,
      data: rows, 
    });

  } catch (error) {
    console.log("Purchase API Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

//sales:id
// sales:id (MONTH WISE)
router.get("/api/sales/:id", async (req, res) => {
  try {
    // console.log('hit hus saled :id')

    const { id } = req.params;
    const { company_id, owner_id, owner_type } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID missing",
      });
    }

    // ids → array
    const idArray = id.split(",").map(Number);

    const [rows] = await pool.query(
      `
      SELECT 
        MONTH(sv.date) AS monthNo,
        SUM(sv.subtotal) AS total

      FROM sales_voucher_items svi

      JOIN sales_vouchers sv
        ON svi.voucherId = sv.id

      WHERE svi.salesLedgerId IN (?)
        AND sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?

      GROUP BY MONTH(sv.date)

      ORDER BY MONTH(sv.date)
      `,
      [idArray, company_id, owner_type, owner_id]
    );

    res.json({
      success: true,
      data: rows,
    });

  } catch (error) {
    console.log("Sales Month API Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});



// GET /api/profit-loss
router.get('/api/profit-loss', async (req, res) => {
  try {
    // Get all ledger groups
    const [groups] = await pool.query('SELECT id, name, type FROM ledger_groups');

    // Get all ledgers with their group info
    const [ledgers] = await pool.query(`
      SELECT 
        l.id, l.name, l.group_id, l.opening_balance, l.balance_type,
        g.name AS group_name,
        g.type AS group_type
      FROM ledgers l
      LEFT JOIN ledger_groups g ON l.group_id = g.id
      ORDER BY g.type, g.name, l.name
    `);

    res.json({ ledgerGroups: groups, ledgers });

  } catch (err) {
    console.error('Error fetching profit & loss data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
