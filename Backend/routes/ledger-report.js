const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/report", async (req, res) => {
  const { ledgerId, fromDate, toDate, includeOpening, includeClosing } =
    req.query;

  console.log(
    "REQ:",
    ledgerId,
    fromDate,
    toDate,
    includeOpening,
    includeClosing
  );

  if (!ledgerId || !fromDate || !toDate) {
    return res.status(400).json({
      success: false,
      message: "Missing ledgerId, fromDate, or toDate",
    });
  }

  const connection = await db.getConnection();

  try {
    // 📌 1️⃣ Fetch Ledger Master
    const [ledRows] = await connection.execute(
      `SELECT l.*, g.name AS groupName 
       FROM ledgers l 
       LEFT JOIN ledger_groups g ON l.group_id = g.id 
       WHERE l.id = ?`,
      [ledgerId]
    );

    if (ledRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Ledger not found" });
    }

    const ledger = ledRows[0];

    // 📌 2️⃣ Find real date range of ledger
    const [[dateRange]] = await connection.execute(
      `SELECT MIN(vm.date) AS minDate, MAX(vm.date) AS maxDate
       FROM voucher_entries ve
       JOIN voucher_main vm ON ve.voucher_id = vm.id
       WHERE ve.ledger_id = ?`,
      [ledgerId]
    );

    if (!dateRange.minDate) {
      return res.json({
        success: true,
        ledger,
        transactions: [],
        summary: {
          openingBalance: ledger.opening_balance,
          closingBalance: ledger.opening_balance,
          totalDebit: 0,
          totalCredit: 0,
          transactionCount: 0,
        },
      });
    }

    const effectiveFromDate = dateRange.minDate;
    const effectiveToDate = dateRange.maxDate;

    // 📌 3️⃣ Calculate Opening Balance
    const [opRows] = await connection.execute(
      `SELECT 
        SUM(CASE WHEN ve.entry_type='debit' THEN ve.amount ELSE 0 END) AS totalDebit,
        SUM(CASE WHEN ve.entry_type='credit' THEN ve.amount ELSE 0 END) AS totalCredit
       FROM voucher_entries ve
       JOIN voucher_main vm ON ve.voucher_id = vm.id
       WHERE ve.ledger_id = ?
       AND vm.date < ?`,
      [ledgerId, effectiveFromDate]
    );

    const totalPreDebit = +opRows[0].totalDebit || 0;
    const totalPreCredit = +opRows[0].totalCredit || 0;

    let runningBalance =
      parseFloat(ledger.opening_balance) +
      (ledger.balance_type === "debit"
        ? totalPreDebit - totalPreCredit
        : totalPreCredit - totalPreDebit);

    // 📌 4️⃣ Fetch all transactions (ledger_name added)
    const [txns] = await connection.execute(
      `SELECT 
         vm.id AS voucher_id,
         vm.voucher_type,
         vm.voucher_number,
         vm.date,
         ve.id AS entry_id,
         ve.entry_type,
         ve.amount,
         ve.narration,
         ve.ledger_name,      -- ⭐️ ledger_name added
         ve.cheque_number,
         ve.bank_name
       FROM voucher_entries ve
       JOIN voucher_main vm ON ve.voucher_id = vm.id
       WHERE ve.ledger_id = ?
       AND vm.date BETWEEN ? AND ?
       ORDER BY vm.date ASC, vm.id ASC, ve.id ASC`,
      [ledgerId, effectiveFromDate, effectiveToDate]
    );

    const transactions = [];
    let balance = runningBalance;

    // 📌 5️⃣ Add Opening Row if required
  

    // 📌 6️⃣ Add all transactions
    txns.forEach((row) => {
      const debit = row.entry_type === "debit" ? +row.amount : 0;
      const credit = row.entry_type === "credit" ? +row.amount : 0;

      balance += debit - credit;

      transactions.push({
        id: row.entry_id,
        date: row.date,
        voucherType: row.voucher_type,
        voucherNo: row.voucher_number,

        // ⭐️ FINAL FIX: Particulars = ledger_name (NOT narration)
        particulars: row.ledger_name || "-",

        debit,
        credit,
        balance,
        narration: row.narration,
        isOpening: false,
        isClosing: false,
      });
    });

    // 📌 7️⃣ Add Closing Row if required


    // 📌 8️⃣ Final Response
    return res.json({
      success: true,
      ledger,
      transactions,
      summary: {
        openingBalance: runningBalance,
        closingBalance: balance,
        totalDebit: txns.reduce(
          (s, r) => s + (r.entry_type === "debit" ? +r.amount : 0),
          0
        ),
        totalCredit: txns.reduce(
          (s, r) => s + (r.entry_type === "credit" ? +r.amount : 0),
          0
        ),
        transactionCount: txns.length,
      },
      appliedDateRange: {
        from: effectiveFromDate,
        to: effectiveToDate,
      },
    });
  } catch (err) {
    console.error("ERROR:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
});

module.exports = router;
