const express = require('express');
const multer = require('multer');
const db = require('../db'); // MySQL connection file

const router = express.Router();
const upload = multer(); // For multipart/form-data

// Save Debit Note Voucher
router.post('/', upload.none(), async (req, res) => {
  try {
    const {
    companyId,
    ownerType,
    ownerId,
    date,
    number,
    mode,
    partyId,
    salesLedgerId,
    narration,
      entries
    } = req.body;

    if (!companyId || !ownerType || !ownerId || !date || !mode || !entries) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const parsedEntries = Array.isArray(entries) ? entries : JSON.parse(entries);

    // Insert main voucher record
    const [voucherResult] = await db.query(
      `INSERT INTO debit_note_vouchers (company_id, owner_type, owner_id, date, number, mode, party_id, sales_ledger_id, narration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, ownerType, ownerId, date, number, mode, partyId || null, salesLedgerId || null, narration || '']
    );

    const voucher_id = voucherResult.insertId;

    // Insert entries
    for (const entry of parsedEntries) {
      await db.query(
        `INSERT INTO debit_note_entries (voucher_id, item_id, hsn_code, quantity, unit, rate, discount, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          voucher_id,
          entry.itemId || null,
          entry.hsnCode || '',
          entry.quantity || 0,
          entry.unit || '',
          entry.rate || 0,
          entry.discount || 0,
          entry.amount || 0
        ]
      );
    }

    res.status(200).json({ success: true, message: 'Debit Note saved successfully' });

  } catch (error) {
    console.error("Error saving debit note:", error);
    res.status(500).json({ success: false, message: 'Error saving debit note', error: error.message });
  }
});

module.exports = router;
