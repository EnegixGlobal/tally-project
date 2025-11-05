const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your configured MySQL pool

// Helper to fetch item details for a voucher
async function getPurchaseVoucherItems(voucherId) {
  const itemSql = `
    SELECT
      pvi.id,
      si.name AS itemName,
      pvi.quantity,
      si.unit,
      pvi.rate,
      pvi.discount,
      pvi.cgstRate,
      pvi.sgstRate,
      pvi.igstRate,
      pvi.amount
    FROM purchase_voucher_items pvi
    LEFT JOIN stock_items si ON pvi.itemId = si.id
    WHERE pvi.voucherId = ?
  `;
  const [items] = await pool.query(itemSql, [voucherId]);
  return items;
}


router.get('/purchase-invoice-matching', async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, fromDate, toDate } = req.query;

    if (!company_id || !owner_type || !owner_id || !fromDate || !toDate) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    let sql = `
      SELECT
        pv.id,
        pv.number AS voucherNo,
        pv.date AS voucherDate,
        pv.supplierInvoiceDate,
        l.name AS supplierName,
        l.gst_number AS supplierGSTIN,
        pv.subtotal AS taxableAmount,
        pv.cgstTotal,
        pv.sgstTotal,
        pv.igstTotal,
        (pv.cgstTotal + pv.sgstTotal + pv.igstTotal) AS totalTaxAmount,
        pv.discountTotal,
        pv.total AS invoiceAmount,
        pv.referenceNo,
        pv.dispatchDocNo,
        pv.dispatchThrough,
        pv.destination,
        pv.purchaseLedgerId,
        pv.narration,
        pv.company_id,
        pv.owner_type,
        pv.owner_id
      FROM purchase_vouchers pv
      LEFT JOIN ledgers l ON pv.partyId = l.id
      WHERE pv.company_id = ?
        AND pv.owner_type = ?
        AND pv.owner_id = ?
        AND pv.date BETWEEN ? AND ?
    `;

    const params = [company_id, owner_type, owner_id, fromDate, toDate];

    // if (supplierName) {
    //   sql += ' AND l.name LIKE ? ';
    //   params.push(`%${supplierName}%`);
    // }

    sql += ' ORDER BY pv.date DESC, pv.number DESC';

    const [rows] = await pool.query(sql, params);

    // For each purchase voucher, fetch item details
    const results = await Promise.all(rows.map(async (row) => {
      const itemDetails = await getPurchaseVoucherItems(row.id);
      return {
        id: row.id,
        voucherNo: row.voucherNo,
        voucherDate: row.voucherDate,
        supplierName: row.supplierName,
        supplierGSTIN: row.supplierGSTIN,
        invoiceAmount: row.invoiceAmount,
        taxableAmount: row.taxableAmount,
        cgstAmount: row.cgstTotal,
        sgstAmount: row.sgstTotal,
        igstAmount: row.igstTotal,
        cessAmount: 0, // Update if you store cess separately
        totalTaxAmount: row.totalTaxAmount,
        invoiceType: '', // Set from your logic or a purchase voucher column if exists
        placeOfSupply: row.destination,
        eWayBillNo: row.dispatchDocNo,
        billOfEntry: '', // If available in your schema, else empty
        billOfEntryDate: '', // If available in your schema, else empty
        gstr2aStatus: 'Pending',  // Placeholder - implement GST matching logic separately
        gstr2Status: 'Pending',   // Placeholder
        isd: '',                  // Placeholder
        itcStatus: 'Not Claimed', // Placeholder
        matchingStatus: 'Unmatched', // Placeholder, implement matching logic as needed
        discrepancies: [],        // Placeholder
        remarks: row.narration,
        lastUpdated: row.updated_at || row.created_at || new Date(),
        itemDetails: itemDetails.map(item => ({
          itemName: item.itemName,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
          taxRate: parseFloat(item.cgstRate || 0) + parseFloat(item.sgstRate || 0) + parseFloat(item.igstRate || 0)
        }))
      };
    }));

    res.json(results);

  } catch (err) {
    console.error('Error fetching purchase invoice matching:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
