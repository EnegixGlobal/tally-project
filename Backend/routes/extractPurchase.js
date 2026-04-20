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

    if (purchaseVouchers.length > 0) {
      const voucherIds = purchaseVouchers.map(v => v.id);

      // Fetch all entries for these vouchers
      const [entries] = await db.query(
        `SELECT 
            ve.voucher_id, ve.ledger_id, ve.amount, ve.entry_type,
            l.name AS ledgerName, l.gst_number AS partyGSTIN,
            lg.name AS groupName
         FROM voucher_entries ve
         LEFT JOIN ledgers l ON ve.ledger_id = l.id
         LEFT JOIN ledger_groups lg ON l.group_id = lg.id
         WHERE ve.voucher_id IN (?)`,
        [voucherIds]
      );

      entries.forEach(entry => {
        const amount = parseFloat(entry.amount) || 0;
        const lName = (entry.ledgerName || "").toLowerCase();
        const gName = (entry.groupName || "").toLowerCase();

        const isTax = gName.includes("duties") || gName.includes("tax") || 
                      lName.includes("cgst") || lName.includes("sgst") || lName.includes("igst") || lName.includes("utgst");
        const isPurchase = gName.includes("purchase account") || lName.includes("purchase");

        // 1. Duties & Taxes (Prioritize)
        if (isTax) {
          if (lName.includes("cgst")) extractData.currentAssets.cgst += amount;
          else if (lName.includes("sgst") || lName.includes("utgst")) extractData.currentAssets.sgst += amount;
          else if (lName.includes("igst")) extractData.currentAssets.igst += amount;
          else {
            extractData.currentAssets.cgst += amount; 
          }
        }
        // 2. Sundry Creditors (Usually Credit in Purchase)
        else if (gName.includes("sundry creditors") || gName.includes("suppliers")) {
          if (!extractData.sundryCreditors[entry.ledgerName]) {
            extractData.sundryCreditors[entry.ledgerName] = {
              partyName: entry.ledgerName,
              partyGSTIN: entry.partyGSTIN || null,
              debit: 0,
              credit: 0
            };
          }
          if (entry.entry_type === "credit") {
            extractData.sundryCreditors[entry.ledgerName].credit += amount;
          } else {
            extractData.sundryCreditors[entry.ledgerName].debit += amount;
          }
        }
        // 3. Purchase Accounts (Usually Debit in Purchase)
        else if (isPurchase) {
          if (!extractData.purchaseAccounts[entry.ledgerName]) {
            extractData.purchaseAccounts[entry.ledgerName] = {
              ledgerName: entry.ledgerName,
              debit: 0,
              credit: 0
            };
          }
          if (entry.entry_type === "debit") {
            extractData.purchaseAccounts[entry.ledgerName].debit += amount;
          } else {
            extractData.purchaseAccounts[entry.ledgerName].credit += amount;
          }
        }
      });
    }

    // Calculate grand totals
    const sundryCreditorsTotal = Object.values(extractData.sundryCreditors).reduce(
      (sum, party) => sum + (party.credit - party.debit), 0
    );

    const purchaseAccountsTotal = Object.values(extractData.purchaseAccounts).reduce(
      (sum, account) => sum + (account.debit - account.credit), 0
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

