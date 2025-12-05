const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {

  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ error: "Missing company_id / owner_type / owner_id" });
  }

  try {
    const [results] = await db.query(`
      SELECT 
        vm.id,
        vm.voucher_type,
        vm.voucher_number,
        vm.date,
        vm.narration,
        vm.reference_no,
        vm.supplier_invoice_date,
        vm.due_date,
        vm.company_id,
        vm.owner_type,
        vm.owner_id,
        
        ve.ledger_id,
        ve.item_id,
        ve.amount,
        ve.entry_type,
        ve.narration AS entry_narration
        
      FROM voucher_main vm
      LEFT JOIN voucher_entries ve ON vm.id = ve.voucher_id
      
      WHERE vm.company_id = ?
      AND vm.owner_type = ?
      AND vm.owner_id = ?
      
      ORDER BY vm.date DESC, vm.id DESC
    `, [company_id, owner_type, owner_id]);


    res.json(results);
  } catch (err) {
    console.error('Error fetching Daybook entries:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
