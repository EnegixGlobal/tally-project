const express = require('express');
const router = express.Router();
const db = require('../db');

// GET Extract Sales data for a specific month or date range
router.get('/', async (req, res) => {
  try {
    const { month, year, fromDate, toDate, company_id, owner_type, owner_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: 'company_id, owner_type, and owner_id are required'
      });
    }

    let finalFromDate, finalToDate;

    // If fromDate and toDate are provided, use them; otherwise use month/year
    if (fromDate && toDate) {
      finalFromDate = fromDate;
      finalToDate = toDate;
    } else if (month && year) {
      // Calculate date range for the month
      const monthIndex = parseInt(month) - 1; // JavaScript months are 0-indexed
      finalFromDate = new Date(year, monthIndex, 1).toISOString().split('T')[0];
      finalToDate = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either (month and year) or (fromDate and toDate) are required'
      });
    }

    // const fromDate = '2025-10-01';
    // const toDate = '2025-12-31';

    // Fetch sales vouchers with ledger and group information
    const [salesVouchers] = await db.execute(
      `SELECT 
        sv.id,
        sv.number AS voucherNo,
        sv.date,
        sv.total,
        sv.subtotal,
        sv.cgstTotal,
        sv.sgstTotal,
        sv.igstTotal,
        sv.partyId,
        sv.salesLedgerId,
        p.name AS partyName,
        p.gst_number AS partyGSTIN,
        pg.name AS partyGroupName,
        sl.name AS salesLedgerName,
        slg.name AS salesLedgerGroupName
      FROM sales_vouchers sv
      LEFT JOIN ledgers p ON sv.partyId = p.id
      LEFT JOIN ledger_groups pg ON p.group_id = pg.id
      LEFT JOIN ledgers sl ON sv.salesLedgerId = sl.id
      LEFT JOIN ledger_groups slg ON sl.group_id = slg.id
      WHERE sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?
        AND sv.date >= ?
        AND sv.date <= ?
      ORDER BY sv.date ASC, sv.number ASC`,
      [company_id, owner_type, owner_id, finalFromDate, finalToDate]
    );

    // Group data for extract format
    const extractData = {
      sundryDebtors: {},
      salesAccounts: {},
      currentLiabilities: {
        cgst: 0,
        sgst: 0,
        igst: 0
      }
    };

    salesVouchers.forEach(voucher => {
      // Sundry Debtors - group by party
      if (voucher.partyId && voucher.partyName) {
        if (!extractData.sundryDebtors[voucher.partyName]) {
          extractData.sundryDebtors[voucher.partyName] = {
            partyName: voucher.partyName,
            partyGSTIN: voucher.partyGSTIN || null,
            debit: 0,
            credit: 0
          };
        }
        extractData.sundryDebtors[voucher.partyName].debit += parseFloat(voucher.total) || 0;
        extractData.sundryDebtors[voucher.partyName].credit += parseFloat(voucher.total) || 0;
      }

      // Sales Accounts - group by sales ledger
      if (voucher.salesLedgerId && voucher.salesLedgerName) {
        if (!extractData.salesAccounts[voucher.salesLedgerName]) {
          extractData.salesAccounts[voucher.salesLedgerName] = {
            ledgerName: voucher.salesLedgerName,
            debit: 0,
            credit: 0
          };
        }
        extractData.salesAccounts[voucher.salesLedgerName].credit += parseFloat(voucher.subtotal) || 0;
      }

      // Current Liabilities - Duties & Taxes
      extractData.currentLiabilities.cgst += parseFloat(voucher.cgstTotal) || 0;
      extractData.currentLiabilities.sgst += parseFloat(voucher.sgstTotal) || 0;
      extractData.currentLiabilities.igst += parseFloat(voucher.igstTotal) || 0;
    });

    // Calculate grand totals
    const sundryDebtorsTotal = Object.values(extractData.sundryDebtors).reduce(
      (sum, party) => sum + party.debit, 0
    );

    const salesAccountsTotal = Object.values(extractData.salesAccounts).reduce(
      (sum, account) => sum + account.credit, 0
    );

    const taxesTotal = extractData.currentLiabilities.cgst +
      extractData.currentLiabilities.sgst +
      extractData.currentLiabilities.igst;

    const grandTotal = Math.max(sundryDebtorsTotal, salesAccountsTotal + taxesTotal);

    res.json({
      success: true,
      data: {
        month: month || null,
        year: year || null,
        fromDate: finalFromDate,
        toDate: finalToDate,
        sundryDebtors: Object.values(extractData.sundryDebtors),
        salesAccounts: Object.values(extractData.salesAccounts),
        currentLiabilities: extractData.currentLiabilities,
        totals: {
          sundryDebtors: sundryDebtorsTotal,
          salesAccounts: salesAccountsTotal,
          taxes: taxesTotal,
          grandTotal
        },
        vouchers: salesVouchers
      }
    });
  } catch (error) {
    console.error('Extract sales error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

