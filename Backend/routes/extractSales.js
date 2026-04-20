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

    if (salesVouchers.length > 0) {
      const voucherIds = salesVouchers.map(v => v.id);

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
        const isSales = gName.includes("sales account") || lName.includes("sales");

        // 1. Duties & Taxes (Prioritize by name and group)
        if (isTax) {
          if (lName.includes("cgst")) extractData.currentLiabilities.cgst += amount;
          else if (lName.includes("sgst") || lName.includes("utgst")) extractData.currentLiabilities.sgst += amount;
          else if (lName.includes("igst")) extractData.currentLiabilities.igst += amount;
          else {
            // Fallback for other taxes
            extractData.currentLiabilities.cgst += amount; 
          }
        }
        // 2. Sundry Debtors (Usually Debit in Sales)
        else if (gName.includes("sundry debtors") || gName.includes("customers")) {
          if (!extractData.sundryDebtors[entry.ledgerName]) {
            extractData.sundryDebtors[entry.ledgerName] = {
              partyName: entry.ledgerName,
              partyGSTIN: entry.partyGSTIN || null,
              debit: 0,
              credit: 0
            };
          }
          if (entry.entry_type === "debit") {
            extractData.sundryDebtors[entry.ledgerName].debit += amount;
          } else {
            extractData.sundryDebtors[entry.ledgerName].credit += amount;
          }
        }
        // 3. Sales Accounts (Usually Credit in Sales)
        else if (isSales) {
          if (!extractData.salesAccounts[entry.ledgerName]) {
            extractData.salesAccounts[entry.ledgerName] = {
              ledgerName: entry.ledgerName,
              debit: 0,
              credit: 0
            };
          }
          if (entry.entry_type === "credit") {
            extractData.salesAccounts[entry.ledgerName].credit += amount;
          } else {
            extractData.salesAccounts[entry.ledgerName].debit += amount;
          }
        }
      });
    }

    // Calculate grand totals
    const sundryDebtorsTotal = Object.values(extractData.sundryDebtors).reduce(
      (sum, party) => sum + (party.debit - party.credit), 0
    );

    const salesAccountsTotal = Object.values(extractData.salesAccounts).reduce(
      (sum, account) => sum + (account.credit - account.debit), 0
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

