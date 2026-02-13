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

    if (!finalCompanyId || !finalOwnerType || !finalOwnerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const [rows] = await pool.execute(
      `SELECT 
          pv.id,
          pv.number AS voucherNo,
          pv.date,
          pv.total AS netAmount,
          pv.total,
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
          AND pv.owner_id = ?

        ORDER BY pv.date DESC`,
      [finalCompanyId, finalOwnerType, finalOwnerId]
    );

    // =========================================================
    // 🔹 FETCH ITEMS FOR THESE VOUCHERS
    // =========================================================
    if (rows.length > 0) {
      const voucherIds = rows.map(row => row.id);

      // Use .query for array expansion support
      const [items] = await pool.query(
        `SELECT 
            pvi.id, pvi.voucherId, pvi.itemId, 
            pvi.quantity, pvi.rate, pvi.amount,
            pvi.cgstRate, pvi.sgstRate, pvi.igstRate, pvi.tdsRate,
            pvi.discount, 
            pvi.purchaseLedgerId,
            
            pl.name AS purchaseLedgerName, 
            pl.group_id AS purchaseLedgerGroupId,
            lg.name AS purchaseLedgerGroupName,

            l_cgst.name AS cgstLedgerName,
            l_sgst.name AS sgstLedgerName,
            l_igst.name AS igstLedgerName,
            l_tds.name  AS tdsLedgerName

         FROM purchase_voucher_items pvi
         
         LEFT JOIN ledgers pl ON pvi.purchaseLedgerId = pl.id
         LEFT JOIN ledger_groups lg ON pl.group_id = lg.id

         LEFT JOIN ledgers l_cgst ON pvi.cgstRate = l_cgst.id
         LEFT JOIN ledgers l_sgst ON pvi.sgstRate = l_sgst.id
         LEFT JOIN ledgers l_igst ON pvi.igstRate = l_igst.id
         LEFT JOIN ledgers l_tds  ON pvi.tdsRate  = l_tds.id

         WHERE pvi.voucherId IN (?)`,
        [voucherIds]
      );

      // Attach items to their respective vouchers with numeric conversion
      const itemsMap = {};
      items.forEach(item => {
        if (!itemsMap[item.voucherId]) {
          itemsMap[item.voucherId] = [];
        }

        // Convert rates/amounts to numbers
        itemsMap[item.voucherId].push({
          ...item,
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
          discount: Number(item.discount) || 0,
          cgstRate: Number(item.cgstRate) || 0,
          sgstRate: Number(item.sgstRate) || 0,
          igstRate: Number(item.igstRate) || 0,
          tdsRate: Number(item.tdsRate) || 0,
        });
      });

      rows.forEach(row => {
        row.items = itemsMap[row.id] || [];

        // Ensure voucher level totals are numbers
        row.netAmount = Number(row.netAmount) || 0;
        row.total = Number(row.total) || 0;
        row.taxableAmount = Number(row.taxableAmount) || 0;
        row.cgstAmount = Number(row.cgstAmount) || 0;
        row.sgstAmount = Number(row.sgstAmount) || 0;
        row.igstAmount = Number(row.igstAmount) || 0;
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





