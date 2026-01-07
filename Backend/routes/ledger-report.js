const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/report", async (req, res) => {
  const { ledgerId } = req.query;

  console.log("REQ LEDGER:", ledgerId);

  if (!ledgerId) {
    return res.status(400).json({
      success: false,
      message: "Missing ledgerId",
    });
  }

  const connection = await db.getConnection();

  try {
    /* ===============================
       1️⃣ LEDGER MASTER
    =============================== */
    const [ledRows] = await connection.execute(
      `SELECT l.*, g.name AS groupName
       FROM ledgers l
       LEFT JOIN ledger_groups g ON g.id = l.group_id
       WHERE l.id = ?`,
      [ledgerId]
    );

    if (!ledRows.length) {
      return res.status(404).json({
        success: false,
        message: "Ledger not found",
      });
    }

    const ledger = ledRows[0];

    /* ===============================
       2️⃣ PURCHASE VOUCHERS → DEBIT
    =============================== */
    const [purchaseVouchers] = await connection.execute(
      `SELECT id, number, date, narration, partyId, total
       FROM purchase_vouchers
       WHERE partyId = ?
       ORDER BY date ASC, id ASC`,
      [ledgerId]
    );

    /* ===============================
       3️⃣ SALES VOUCHERS → CREDIT
    =============================== */
    const [salesVouchers] = await connection.execute(
      `SELECT id, number, date, narration, partyId, total
       FROM sales_vouchers
       WHERE partyId = ?
         AND type = 'sales'
         AND isQuotation = 0
       ORDER BY date ASC, id ASC`,
      [ledgerId]
    );

    /* ===============================
       4️⃣ SALES ORDERS + ITEMS 🔥
    =============================== */
    const [salesOrderRows] = await connection.execute(
      `SELECT
         so.id            AS salesOrderId,
         so.number        AS orderNumber,
         so.date,
         so.partyId,
         so.salesLedgerId,
         so.status,
         so.narration,

         soi.id           AS itemRowId,
         soi.itemId,
         soi.quantity,
         soi.rate,
         soi.discount,
         soi.amount,
         soi.cgstRate,
         soi.sgstRate,
         soi.igstRate
       FROM sales_orders so
       LEFT JOIN sales_order_items soi
         ON soi.salesOrderId = so.id
       WHERE so.salesLedgerId = ?
       ORDER BY so.date ASC, so.id ASC`,
      [ledgerId]
    );

    /* ===============================
       5️⃣ NORMAL LEDGER ENTRIES
    =============================== */
    const [txns] = await connection.execute(
      `SELECT
         vm.voucher_type,
         vm.voucher_number,
         vm.date,
         ve.entry_type,
         ve.amount,
         ve.narration
       FROM voucher_entries ve
       JOIN voucher_main vm ON vm.id = ve.voucher_id
       WHERE ve.ledger_id = ?
       ORDER BY vm.date ASC`,
      [ledgerId]
    );

    /* ===============================
       6️⃣ BUILD TRANSACTIONS
    =============================== */
    let balance = Number(ledger.opening_balance || 0);
    const transactions = [];

    // Normal vouchers
    txns.forEach((row) => {
      const debit = row.entry_type === "debit" ? Number(row.amount) : 0;
      const credit = row.entry_type === "credit" ? Number(row.amount) : 0;

      balance += debit - credit;

      transactions.push({
        date: row.date,
        voucherType: row.voucher_type,
        voucherNo: row.voucher_number,
        particulars: row.narration || "-",
        debit,
        credit,
        balance,
      });
    });

    // Purchase → Debit
    purchaseVouchers.forEach((pv) => {
      const debit = Number(pv.total || 0);
      balance += debit;

      transactions.push({
        date: pv.date,
        voucherType: "Purchase",
        voucherNo: pv.number,
        particulars: pv.partyId.toString(),
        debit,
        credit: 0,
        balance,
      });
    });

    // Sales Voucher → Credit
    salesVouchers.forEach((sv) => {
      const credit = Number(sv.total || 0);
      balance -= credit;

      transactions.push({
        date: sv.date,
        voucherType: "Sales",
        voucherNo: sv.number,
        particulars: sv.partyId.toString(),
        debit: 0,
        credit,
        balance,
      });
    });

    /* ===============================
       7️⃣ SALES ORDER GROUPING
    =============================== */
    const salesOrdersMap = {};

    salesOrderRows.forEach((row) => {
      if (!salesOrdersMap[row.salesOrderId]) {
        salesOrdersMap[row.salesOrderId] = {
          id: row.salesOrderId,
          number: row.orderNumber,
          date: row.date,
          partyId: row.partyId,
          salesLedgerId: row.salesLedgerId,
          status: row.status,
          narration: row.narration,
          items: [],
          total: 0,
        };
      }

      if (row.itemRowId) {
        salesOrdersMap[row.salesOrderId].items.push({
          id: row.itemRowId,
          itemId: row.itemId,
          quantity: Number(row.quantity),
          rate: Number(row.rate),
          discount: Number(row.discount),
          amount: Number(row.amount),
          cgstRate: Number(row.cgstRate),
          sgstRate: Number(row.sgstRate),
          igstRate: Number(row.igstRate),
        });

        salesOrdersMap[row.salesOrderId].total += Number(row.amount || 0);
      }
    });

    const salesOrders = Object.values(salesOrdersMap);

    // Sales Orders → Credit
    salesOrders.forEach((so) => {
      const credit = Number(so.total || 0);
      balance -= credit;

      transactions.push({
        date: so.date,
        voucherType: "Sales Order",
        voucherNo: so.number,
        particulars: so.salesLedgerId.toString(),
        debit: 0,
        credit,
        balance,
      });
    });

    /* ===============================
       8️⃣ SORT BY DATE
    =============================== */
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    /* ===============================
       9️⃣ SUMMARY
    =============================== */
    const totalDebit = transactions.reduce((s, r) => s + r.debit, 0);
    const totalCredit = transactions.reduce((s, r) => s + r.credit, 0);

    return res.json({
      success: true,
      ledger,
      transactions,
      salesOrders, // 👈 frontend ko full order + items
      summary: {
        openingBalance: Number(ledger.opening_balance || 0),
        closingBalance: balance,
        totalDebit,
        totalCredit,
        transactionCount: transactions.length,
      },
    });
  } catch (err) {
    console.error("LEDGER REPORT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
