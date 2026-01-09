const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/report", async (req, res) => {
  const { ledgerId } = req.query;

  // console.log("REQ LEDGER:", ledgerId);

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
      `SELECT id, number, date, narration, partyId, total, isQuotation
       FROM sales_vouchers
       WHERE partyId = ?
         AND type = 'sales'
         AND isQuotation = 0
       ORDER BY date ASC, id ASC`,
      [ledgerId]
    );

    /* ===============================
       3️⃣A QUOTATIONS → CREDIT
    =============================== */
    const [quotations] = await connection.execute(
      `SELECT id, number, date, narration, partyId, total, isQuotation
       FROM sales_vouchers
       WHERE partyId = ?
         AND isQuotation = 1
       ORDER BY date ASC, id ASC`,
      [ledgerId]
    );

    /* ===============================
       4️⃣ SALES ORDERS + ITEMS → CREDIT
    =============================== */
    const [salesOrderRows] = await connection.execute(
      `SELECT
         so.id   AS salesOrderId,
         so.number,
         so.date,
         so.partyId,
         so.salesLedgerId,
         so.status,
         so.narration,

         soi.id AS itemRowId,
         soi.itemId,
         soi.quantity,
         soi.rate,
         soi.discount,
         soi.amount
       FROM sales_orders so
       LEFT JOIN sales_order_items soi
         ON soi.salesOrderId = so.id
       WHERE so.salesLedgerId = ?
       ORDER BY so.date ASC, so.id ASC`,
      [ledgerId]
    );

    /* ===============================
       5️⃣ PURCHASE ORDERS + ITEMS → DEBIT 🔥
    =============================== */
    const [purchaseOrderRows] = await connection.execute(
      `SELECT
         po.id   AS purchaseOrderId,
         po.number,
         po.date,
         po.party_id,
         po.purchase_ledger_id,
         po.status,
         po.narration,

         poi.id AS itemRowId,
         poi.item_id,
         poi.quantity,
         poi.rate,
         poi.discount,
         poi.amount
       FROM purchase_orders po
       LEFT JOIN purchase_order_items poi
         ON poi.purchase_order_id = po.id
       WHERE po.purchase_ledger_id = ?
       ORDER BY po.date ASC, po.id ASC`,
      [ledgerId]
    );

    /* ===============================
       6️⃣ NORMAL LEDGER ENTRIES
    =============================== */
    const [txns] = await connection.execute(
      `
  SELECT
    vm.id AS voucher_id,
    vm.voucher_type,
    vm.voucher_number,
    vm.date,

    ve.entry_type,
    ve.amount,
    ve.narration AS entry_narration,

    ve.ledger_id,
    l.name AS ledger_name

  FROM voucher_entries ve
  JOIN voucher_main vm ON vm.id = ve.voucher_id
  LEFT JOIN ledgers l ON l.id = ve.ledger_id
  WHERE ve.ledger_id = ?
  ORDER BY vm.date ASC
  `,
      [ledgerId]
    );

    /* ===============================
   6️⃣A DEBIT / CREDIT NOTES 🔥 (NEW)
*/
    const [dcNotes] = await connection.execute(
      `
  SELECT id, date, number, party_id, narration
  FROM debit_note_vouchers
  WHERE narration IS NOT NULL
  ORDER BY date ASC, id ASC
  `
    );

    /* ===============================
   6️⃣B CREDIT NOTES 🔥
=============================== */
    const [creditNotes] = await connection.execute(
      `
  SELECT id, date, number, mode, narration
  FROM credit_vouchers
  WHERE narration IS NOT NULL
    AND company_id = ?
    AND owner_type = ?
    AND owner_id = ?
  ORDER BY date ASC, id ASC
  `,
      [ledger.company_id, ledger.owner_type, ledger.owner_id]
    );

    /* ===============================
       7️⃣ BUILD TRANSACTIONS
    =============================== */
    let balance = Number(ledger.opening_balance || 0);
    const transactions = [];

    // Normal vouchers
    txns.forEach((row) => {
      const debit = row.entry_type === "debit" ? Number(row.amount) : 0;
      const credit = row.entry_type === "credit" ? Number(row.amount) : 0;

      balance += debit - credit;

      transactions.push({
        id: String(row.voucher_id || `voucher_${row.voucher_number}`),
        date: row.date,
        voucherType: row.voucher_type,
        voucherNo: row.voucher_number,

        particulars: row.ledger_name || String(row.ledger_id),

        debit,
        credit,
        balance,
      });
    });

    // Debit  Notes
    dcNotes.forEach((note) => {
      let parsed;

      try {
        parsed = JSON.parse(note.narration);
      } catch {
        return;
      }

      if (!Array.isArray(parsed.accountingEntries)) return;

      parsed.accountingEntries.forEach((entry) => {
        // ✅ LEDGER FILTER
        if (String(entry.ledgerId) !== String(ledgerId)) return;

        const debit = entry.type === "debit" ? Number(entry.amount || 0) : 0;
        const credit = entry.type === "credit" ? Number(entry.amount || 0) : 0;

        balance += debit - credit;

        transactions.push({
          id: `DN-${note.id}-${entry.ledgerId}`,
          date: note.date,
          voucherType: "Debit Note",
          voucherNo: note.number,
          particulars: String(entry.ledgerId),
          debit,
          credit,
          balance,
        });
      });
    });

    // Credit Notes
    creditNotes.forEach((note) => {
      let parsed;

      try {
        parsed = JSON.parse(note.narration);
      } catch {
        return;
      }

      if (!Array.isArray(parsed.accountingEntries)) return;

      parsed.accountingEntries.forEach((entry) => {
        if (String(entry.ledgerId) !== String(ledgerId)) return;

        const debit = entry.type === "debit" ? Number(entry.amount || 0) : 0;
        const credit = entry.type === "credit" ? Number(entry.amount || 0) : 0;

        balance += debit - credit;

        transactions.push({
          id: `CN-${note.id}-${entry.ledgerId}`,
          date: note.date,
          voucherType: "Credit Note",
          voucherNo: note.number,
          referenceNo: note.mode,
          particulars: String(entry.ledgerId),
          debit,
          credit,
          balance,
        });
      });
    });

    // Purchase Voucher → Debit
    purchaseVouchers.forEach((pv) => {
      const debit = Number(pv.total || 0);
      balance += debit;

      transactions.push({
        id: String(pv.id),
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
        id: String(sv.id),
        date: sv.date,
        voucherType: "Sales",
        voucherNo: sv.number,
        particulars: sv.partyId.toString(),
        debit: 0,
        credit,
        balance,
      });
    });

    // Quotations → Credit
    quotations.forEach((qt) => {
      const credit = Number(qt.total || 0);
      balance -= credit;

      transactions.push({
        id: String(qt.id),
        date: qt.date,
        voucherType: "Quotation",
        voucherNo: qt.number,
        particulars: qt.partyId.toString(),
        debit: 0,
        credit,
        balance,
        isQuotation: true,
      });
    });

    /* ===============================
       8️⃣ GROUP SALES ORDERS
    =============================== */
    const salesOrdersMap = {};

    salesOrderRows.forEach((row) => {
      if (!salesOrdersMap[row.salesOrderId]) {
        salesOrdersMap[row.salesOrderId] = {
          id: row.salesOrderId,
          number: row.number,
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
          itemId: row.itemId,
          quantity: Number(row.quantity),
          rate: Number(row.rate),
          discount: Number(row.discount),
          amount: Number(row.amount),
        });

        salesOrdersMap[row.salesOrderId].total += Number(row.amount || 0);
      }
    });

    const salesOrders = Object.values(salesOrdersMap);

    // Sales Order → Credit
    salesOrders.forEach((so) => {
      const credit = Number(so.total || 0);
      balance -= credit;

      transactions.push({
        id: String(so.id),
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
       9️⃣ GROUP PURCHASE ORDERS 🔥
    =============================== */
    const purchaseOrdersMap = {};

    purchaseOrderRows.forEach((row) => {
      if (!purchaseOrdersMap[row.purchaseOrderId]) {
        purchaseOrdersMap[row.purchaseOrderId] = {
          id: row.purchaseOrderId,
          number: row.number,
          date: row.date,
          partyId: row.party_id,
          purchaseLedgerId: row.purchase_ledger_id,
          status: row.status,
          narration: row.narration,
          items: [],
          total: 0,
        };
      }

      if (row.itemRowId) {
        purchaseOrdersMap[row.purchaseOrderId].items.push({
          itemId: row.item_id,
          quantity: Number(row.quantity),
          rate: Number(row.rate),
          discount: Number(row.discount),
          amount: Number(row.amount),
        });

        purchaseOrdersMap[row.purchaseOrderId].total += Number(row.amount || 0);
      }
    });

    const purchaseOrders = Object.values(purchaseOrdersMap);

    // Purchase Order → Debit
    purchaseOrders.forEach((po) => {
      const debit = Number(po.total || 0);
      balance += debit;

      transactions.push({
        id: String(po.id),
        date: po.date,
        voucherType: "Purchase Order",
        voucherNo: po.number,
        particulars: po.purchaseLedgerId.toString(),
        debit,
        credit: 0,
        balance,
      });
    });

    /* ===============================
       🔟 SORT BY DATE
    =============================== */
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    /* ===============================
       1️⃣1️⃣ SUMMARY
    =============================== */
    const totalDebit = transactions.reduce((s, r) => s + r.debit, 0);
    const totalCredit = transactions.reduce((s, r) => s + r.credit, 0);

    return res.json({
      success: true,
      ledger,
      transactions,
      salesOrders,
      purchaseOrders,
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
