const express = require('express');
const router = express.Router();
const pool = require('../db');


// router.get("/ledger-report", async (req, res) => {
//   try {
//     const { company_id, owner_type, owner_id } = req.query;

//     if (!company_id || !owner_type || !owner_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required parameters",
//       });
//     }

//     // ================================
//     // 1️⃣ GET PURCHASE VOUCHERS
//     // ================================
//     const [purchaseVouchers] = await pool.execute(
//       `SELECT *
//        FROM purchase_vouchers
//        WHERE company_id = ?
//          AND owner_type = ?
//          AND owner_id = ?`,
//       [company_id, owner_type, owner_id]
//     );

//     if (purchaseVouchers.length === 0) {
//       return res.json({
//         success: true,
//         message: "No purchase vouchers found",
//         data: [],
//       });
//     }

//     // ================================
//     // 2️⃣ EXTRACT partyId & purchaseLedgerId
//     // ================================
//     const partyIds = [
//       ...new Set(purchaseVouchers.map(v => v.partyId).filter(Boolean))
//     ];

//     const purchaseLedgerIds = [
//       ...new Set(purchaseVouchers.map(v => v.purchaseLedgerId).filter(Boolean))
//     ];

//     // ================================
//     // 3️⃣ GET PARTY LEDGER DATA
//     // ================================
//     let partyLedgers = [];
//     if (partyIds.length > 0) {
//       const placeholders = partyIds.map(() => "?").join(",");

//       const [rows] = await pool.execute(
//         `SELECT *
//          FROM ledgers
//          WHERE id IN (${placeholders})
//            AND company_id = ?
//            AND owner_type = ?
//            AND owner_id = ?`,
//         [...partyIds, company_id, owner_type, owner_id]
//       );

//       partyLedgers = rows;
//     }

//     // ================================
//     // 4️⃣ GET PURCHASE LEDGER DATA
//     // ================================
//     let purchaseLedgers = [];
//     if (purchaseLedgerIds.length > 0) {
//       const placeholders = purchaseLedgerIds.map(() => "?").join(",");

//       const [rows] = await pool.execute(
//         `SELECT *
//          FROM ledgers
//          WHERE id IN (${placeholders})
//            AND company_id = ?
//            AND owner_type = ?
//            AND owner_id = ?`,
//         [...purchaseLedgerIds, company_id, owner_type, owner_id]
//       );

//       purchaseLedgers = rows;
//     }

//     console.log('partyL', partyLedgers, purchaseLedgers, purchaseVouchers)

//     // ================================
//     // 5️⃣ SEND RESPONSE
//     // ================================
//     res.json({
//       success: true,
//       data: {
//         partyLedgers,          // 🔹 partyId ka pura ledger data
//         purchaseLedgers,       // 🔹 purchaseLedgerId ka pura ledger data
//         purchaseVouchers       // 🔹 original vouchers bhi bhej diya
//       },
//     });

//   } catch (error) {
//     console.error("Ledger Report Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// });









router.get("/", async (req, res) => {
  try {
    const finalCompanyId = req.query.company_id || req.body?.companyId;
    const finalOwnerType = req.query.owner_type || req.body?.ownerType;
    const finalOwnerId = req.query.owner_id || req.body?.ownerId;
    const fromDate = req.query.from_date;
    const toDate = req.query.to_date;

    if (!finalCompanyId || !finalOwnerType || !finalOwnerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let query = `SELECT 
          pv.id,
          pv.number AS voucherNo,
          pv.date,
          pv.total AS netAmount,
          pv.total,
          pv.discountTotal,
          pv.subtotal AS taxableAmount,
          pv.cgstTotal AS cgstAmount,
          pv.sgstTotal AS sgstAmount,
          pv.igstTotal AS igstAmount,
          pv.tdsTotal AS tdsAmount,

          l.id AS ledgerId,
          l.name AS partyName,
          l.group_id AS groupId,
          lg.name AS groupName,
          l.gst_number AS partyGSTIN

        FROM purchase_vouchers pv
        LEFT JOIN ledgers l 
          ON pv.partyId = l.id
        LEFT JOIN ledger_groups lg 
          ON l.group_id = lg.id

        WHERE pv.company_id = ?
          AND pv.owner_type = ?
          AND pv.owner_id = ?`;

    const queryParams = [finalCompanyId, finalOwnerType, finalOwnerId];

    if (fromDate && toDate) {
      query += ` AND pv.date BETWEEN ? AND ?`;
      queryParams.push(fromDate, toDate);
    }

    query += ` ORDER BY pv.date DESC`;

    const [rows] = await pool.execute(query, queryParams);

    // =========================================================
    // 🔹 FETCH ITEMS & ENTRIES FOR THESE VOUCHERS
    // =========================================================
    if (rows.length > 0) {
      const voucherIds = rows.map(row => row.id);

      // 1. Fetch Item Invoice Items
      const [items] = await pool.query(
        `SELECT 
            pvi.id, pvi.voucherId, pvi.itemId, 
            pvi.quantity, pvi.rate, pvi.amount,
            pvi.cgstRate, pvi.sgstRate, pvi.igstRate, pvi.tdsRate,
            pvi.discount, 
            pvi.purchaseLedgerId,
            pvi.discountLedgerId,
            
            i.name AS itemName,
            i.hsnCode,
            i.gstRate,

            pl.name AS purchaseLedgerName, 
            pl.group_id AS purchaseLedgerGroupId,
            lg.name AS purchaseLedgerGroupName,

            l_cgst.name AS cgstLedgerName,
            l_sgst.name AS sgstLedgerName,
            l_igst.name AS igstLedgerName,
            l_tds.name  AS tdsLedgerName,
            dl.name AS discountLedgerName

         FROM purchase_voucher_items pvi
         LEFT JOIN items i ON pvi.itemId = i.id
         LEFT JOIN ledgers pl ON pvi.purchaseLedgerId = pl.id
         LEFT JOIN ledger_groups lg ON pl.group_id = lg.id
         LEFT JOIN ledgers dl ON pvi.discountLedgerId = dl.id

         LEFT JOIN ledgers l_cgst ON pvi.cgstRate = l_cgst.id
         LEFT JOIN ledgers l_sgst ON pvi.sgstRate = l_sgst.id
         LEFT JOIN ledgers l_igst ON pvi.igstRate = l_igst.id
         LEFT JOIN ledgers l_tds  ON pvi.tdsRate  = l_tds.id

         WHERE pvi.voucherId IN (?)`,
        [voucherIds]
      );

      // 2. Fetch Accounting Voucher Entries
      const [accEntries] = await pool.query(
        `SELECT 
            ve.id, ve.voucher_id as voucherId, ve.ledger_id as ledgerId,
            ve.amount, ve.entry_type, ve.narration,
            l.name AS ledgerName,
            lg.name AS groupName,
            lg.id AS groupId
         FROM voucher_entries ve
         LEFT JOIN ledgers l ON ve.ledger_id = l.id
         LEFT JOIN ledger_groups lg ON l.group_id = lg.id
         WHERE ve.voucher_id IN (?)`,
        [voucherIds]
      );

      // Attach items to their respective vouchers with numeric conversion
      const itemsMap = {};
      
      // Process regular items
      items.forEach(item => {
        if (!itemsMap[item.voucherId]) {
          itemsMap[item.voucherId] = [];
        }

        itemsMap[item.voucherId].push({
          ...item,
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
          discount: Number(item.discount) || 0,
          gstRate: Number(item.gstRate) || 0,
          discountLedgerName: item.discountLedgerName || null,
        });
      });

      // Process accounting entries and map them to "pseudo-items"
      const accEntriesMap = {};
      accEntries.forEach(entry => {
        if (!accEntriesMap[entry.voucherId]) accEntriesMap[entry.voucherId] = [];
        accEntriesMap[entry.voucherId].push(entry);
      });

      rows.forEach(row => {
        if (!row.items) row.items = itemsMap[row.id] || [];

        // For accounting vouchers, we populate pseudo-items
        const vEntries = accEntriesMap[row.id] || [];
        if (vEntries.length > 0) {
          let purchaseEntries = [];
          let taxEntries = { cgst: [], sgst: [], igst: [], tds: [], discount: [] };

          vEntries.forEach(e => {
            const amt = Number(e.amount || 0);
            const lName = (e.ledgerName || "").toLowerCase();
            const gName = (e.groupName || "").toLowerCase();

            if (e.entry_type === "debit") {
              const isTax = (gName && (gName.includes("duties") || gName.includes("tax") || gName.includes("gst"))) ||
                            (lName.includes("gst") || lName.includes("tax") || lName.includes("igst") || lName.includes("cgst") || lName.includes("sgst") || lName.includes("@"));

              if (isTax) {
                if (lName.includes("cgst")) taxEntries.cgst.push(e);
                else if (lName.includes("sgst") || lName.includes("utgst")) taxEntries.sgst.push(e);
                else if (lName.includes("igst")) taxEntries.igst.push(e);
                else taxEntries.cgst.push(e);
              } else {
                purchaseEntries.push(e);
              }
            } else {
              const isDiscount = lName.includes("discount") || (gName && gName.includes("discount"));
              const isTds = lName.includes("tds") || (gName && gName.includes("tds"));
              
              if (isDiscount) taxEntries.discount.push(e);
              else if (isTds) taxEntries.tds.push(e);
            }
          });

          purchaseEntries.forEach((pe, idx) => {
            const pseudoItem = {
              id: `acc-${pe.id}`,
              voucherId: pe.voucherId,
              amount: Number(pe.amount) || 0,
              purchaseLedgerName: pe.ledgerName,
              purchaseLedgerGroupName: pe.groupName,
              purchaseLedgerGroupId: pe.groupId,
              itemName: pe.ledgerName, 
              quantity: 0,
              rate: 0
            };

            if (idx === 0) {
              if (taxEntries.cgst.length > 0) pseudoItem.cgstLedgerName = taxEntries.cgst[0].ledgerName;
              if (taxEntries.sgst.length > 0) pseudoItem.sgstLedgerName = taxEntries.sgst[0].ledgerName;
              if (taxEntries.igst.length > 0) pseudoItem.igstLedgerName = taxEntries.igst[0].ledgerName;
              if (taxEntries.tds.length > 0) pseudoItem.tdsLedgerName = taxEntries.tds[0].ledgerName;
              if (taxEntries.discount.length > 0) pseudoItem.discountLedgerName = taxEntries.discount[0].ledgerName;
            }
            row.items.push(pseudoItem);
          });
          
          if (purchaseEntries.length === 0 && (taxEntries.cgst.length > 0 || taxEntries.sgst.length > 0 || taxEntries.igst.length > 0)) {
             row.items.push({
               id: `acc-tax-${row.id}`,
               voucherId: row.id,
               amount: 0,
               purchaseLedgerName: "Purchase (Accounting)",
               cgstLedgerName: taxEntries.cgst[0]?.ledgerName,
               sgstLedgerName: taxEntries.sgst[0]?.ledgerName,
               igstLedgerName: taxEntries.igst[0]?.ledgerName,
               tdsLedgerName: taxEntries.tds[0]?.ledgerName,
               discountLedgerName: taxEntries.discount[0]?.ledgerName
             });
          }
        }

        row.netAmount = Number(row.netAmount) || 0;
        row.total = Number(row.total) || 0;
        row.discountTotal = Number(row.discountTotal) || 0;
        row.taxableAmount = Number(row.taxableAmount) || 0;
        row.cgstAmount = Number(row.cgstAmount) || 0;
        row.sgstAmount = Number(row.sgstAmount) || 0;
        row.igstAmount = Number(row.igstAmount) || 0;
        row.tdsAmount = Number(row.tdsAmount) || 0;
      });
    }

    // console.log(
    //   "ROWS WITH ITEMS:\n",
    //   JSON.stringify(rows, null, 2)
    // );

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.error("Purchase Report Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});


module.exports = router;





