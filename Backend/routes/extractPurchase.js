const express = require('express');
const router = express.Router();
const db = require('../db');

// GET Extract Purchase data for a specific month or date range
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

    // Fetch purchase vouchers with ledger and group information
    const [purchaseVouchers] = await db.execute(
      `SELECT 
        pv.id,
        pv.number AS voucherNo,
        pv.date,
        pv.total,
        pv.subtotal,
        pv.cgstTotal,
        pv.sgstTotal,
        pv.igstTotal,
        pv.partyId,
        pv.purchaseLedgerId,
        p.name AS partyName,
        p.gst_number AS partyGSTIN,
        pg.name AS partyGroupName,
        pl.name AS purchaseLedgerName,
        plg.name AS purchaseLedgerGroupName
      FROM purchase_vouchers pv
      LEFT JOIN ledgers p ON pv.partyId = p.id
      LEFT JOIN ledger_groups pg ON p.group_id = pg.id
      LEFT JOIN ledgers pl ON pv.purchaseLedgerId = pl.id
      LEFT JOIN ledger_groups plg ON pl.group_id = plg.id
      WHERE pv.company_id = ?
        AND pv.owner_type = ?
        AND pv.owner_id = ?
        AND pv.date >= ?
        AND pv.date <= ?
      ORDER BY pv.date ASC, pv.number ASC`,
      [company_id, owner_type, owner_id, finalFromDate, finalToDate]
    );

    // Group data for extract format
    const extractData = {
      sundryCreditors: {},
      purchaseAccounts: {},
      currentAssets: {
        cgst: 0,
        sgst: 0,
        igst: 0
      }
    };

    purchaseVouchers.forEach(voucher => {
      // Sundry Creditors - group by party
      if (voucher.partyId && voucher.partyName) {
        if (!extractData.sundryCreditors[voucher.partyName]) {
          extractData.sundryCreditors[voucher.partyName] = {
            partyName: voucher.partyName,
            partyGSTIN: voucher.partyGSTIN || null,
            debit: 0,
            credit: 0
          };
        }
        extractData.sundryCreditors[voucher.partyName].debit += parseFloat(voucher.total) || 0;
        extractData.sundryCreditors[voucher.partyName].credit += parseFloat(voucher.total) || 0;
      }

      // Purchase Accounts - group by purchase ledger
      if (voucher.purchaseLedgerId && voucher.purchaseLedgerName) {
        if (!extractData.purchaseAccounts[voucher.purchaseLedgerName]) {
          extractData.purchaseAccounts[voucher.purchaseLedgerName] = {
            ledgerName: voucher.purchaseLedgerName,
            debit: 0,
            credit: 0
          };
        }
        extractData.purchaseAccounts[voucher.purchaseLedgerName].debit += parseFloat(voucher.subtotal) || 0;
      }

      // Current Assets - Duties & Taxes (Input Tax Credit)
      extractData.currentAssets.cgst += parseFloat(voucher.cgstTotal) || 0;
      extractData.currentAssets.sgst += parseFloat(voucher.sgstTotal) || 0;
      extractData.currentAssets.igst += parseFloat(voucher.igstTotal) || 0;
    });

    // Calculate grand totals
    const sundryCreditorsTotal = Object.values(extractData.sundryCreditors).reduce(
      (sum, party) => sum + party.credit, 0
    );

    const purchaseAccountsTotal = Object.values(extractData.purchaseAccounts).reduce(
      (sum, account) => sum + account.debit, 0
    );

    const taxesTotal = extractData.currentAssets.cgst +
      extractData.currentAssets.sgst +
      extractData.currentAssets.igst;

    const grandTotal = Math.max(sundryCreditorsTotal, purchaseAccountsTotal + taxesTotal);

    res.json({
      success: true,
      data: {
        month: month || null,
        year: year || null,
        fromDate: finalFromDate,
        toDate: finalToDate,
        sundryCreditors: Object.values(extractData.sundryCreditors),
        purchaseAccounts: Object.values(extractData.purchaseAccounts),
        currentAssets: extractData.currentAssets,
        totals: {
          sundryCreditors: sundryCreditorsTotal,
          purchaseAccounts: purchaseAccountsTotal,
          taxes: taxesTotal,
          grandTotal
        },
        vouchers: purchaseVouchers
      }
    });
  } catch (error) {
    console.error('Extract purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

