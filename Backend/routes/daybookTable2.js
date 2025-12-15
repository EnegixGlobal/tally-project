const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res
      .status(400)
      .json({ error: "Missing company_id / owner_type / owner_id" });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT 
        vm.id AS voucher_id,
        vm.voucher_type,
        vm.voucher_number,
        vm.date,
        vm.narration,
        vm.reference_no,
        vm.supplier_invoice_date,
        vm.company_id,
        vm.owner_type,
        vm.owner_id,

        ve.id AS entry_id,
        ve.ledger_id,
        l.name AS ledger_name,         -- ⭐ FIXED: Always fetch ledger name from ledger table
        ve.amount,
        ve.entry_type,
        ve.narration AS entry_narration,
        ve.item_id

      FROM voucher_main vm
      LEFT JOIN voucher_entries ve ON vm.id = ve.voucher_id
      LEFT JOIN ledgers l ON l.id = ve.ledger_id   -- ⭐ FIXED: This JOIN was missing
      WHERE vm.company_id = ?
      AND vm.owner_type = ?
      AND vm.owner_id = ?
      ORDER BY vm.date DESC, vm.id DESC, ve.id ASC
    `,
      [company_id, owner_type, owner_id]
    );

    // -----------------------------
    // GROUP RESPONSE
    // -----------------------------
    const vouchers = {};

    rows.forEach((row) => {
      if (!vouchers[row.voucher_id]) {
        vouchers[row.voucher_id] = {
          id: row.voucher_id,
          voucher_type: row.voucher_type,
          voucher_number: row.voucher_number,
          date: row.date,
          narration: row.narration,
          reference_no: row.reference_no,
          supplier_invoice_date: row.supplier_invoice_date,
          company_id: row.company_id,
          owner_type: row.owner_type,
          owner_id: row.owner_id,
          entries: [],
        };
      }

      // If entry exists
      if (row.entry_id) {
        vouchers[row.voucher_id].entries.push({
          id: row.entry_id,
          ledger_id: row.ledger_id,
          ledger_name: row.ledger_name,   // ⭐ Now always correct (from JOIN)
          amount: row.amount,
          entry_type: row.entry_type,
          narration: row.entry_narration,
          item_id: row.item_id,
        });
      }
    });

    const finalResponse = Object.values(vouchers);

   

    // Return clean array
    res.json(finalResponse);
  } catch (err) {
    console.error("❌ Error fetching vouchers:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
