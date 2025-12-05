const express = require("express");
const router = express.Router();
const db = require("../db"); // your mysql2/promise connection pool

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
    return res
      .status(400)
      .json({
        success: false,
        message: "Missing ledgerId, fromDate, or toDate",
      });
  }

  const connection = await db.getConnection();

  try {
    // Get ledger master
    const [ledRows] = await connection.execute(
      `SELECT l.*, g.name as groupName 
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

    // AUTO DETECT REAL DATE RANGE FOR THIS LEDGER
    const [[dateRange]] = await connection.execute(
      `SELECT MIN(vm.date) as minDate, MAX(vm.date) as maxDate
         FROM voucher_entries ve
         JOIN voucher_main vm ON ve.voucher_id = vm.id
         WHERE ve.ledger_id = ?`,
      [ledgerId]
    );

    // If no entry found → empty data
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


    // Opening balance BEFORE actual min date
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

    // Fetch ACTUAL PERIOD transactions
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

    // Add real opening ONLY when needed
    if (includeOpening === "true") {
      transactions.push({
        id: "opening",
        date: effectiveFromDate,
        particulars: "Opening Balance",
        voucherType: "",
        voucherNo: "",
        debit: ledger.balance_type === "debit" ? runningBalance : 0,
        credit: ledger.balance_type === "credit" ? Math.abs(runningBalance) : 0,
        balance,
        isOpening: true,
        isClosing: false,
      });
    }

    txns.forEach((row) => {
      const debit = row.entry_type === "debit" ? +row.amount : 0;
      const credit = row.entry_type === "credit" ? +row.amount : 0;

      balance += debit - credit;
      transactions.push({
        id: row.entry_id,
        date: row.date,
        voucherType: row.voucher_type,
        voucherNo: row.voucher_number,
        particulars: row.narration || "-",
        debit,
        credit,
        balance,
        narration: row.narration,
        isOpening: false,
        isClosing: false,
      });
    });

    // Add real closing
    if (includeClosing === "true") {
      transactions.push({
        id: "closing",
        date: effectiveToDate,
        particulars: "Closing Balance",
        voucherType: "",
        voucherNo: "",
        debit: balance < 0 ? Math.abs(balance) : 0,
        credit: balance > 0 ? balance : 0,
        balance: 0,
        isOpening: false,
        isClosing: true,
      });
    }

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
    return res.status(500).json({ success: false, message: "Internal error" });
  } finally {
    connection.release();
  }
});

module.exports = router;
