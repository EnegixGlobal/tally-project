const express = require('express');
const router = express.Router();
const db = require('../db');
// GET distinct voucher types
router.get("/", (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;
  if (!company_id || !owner_type || !owner_id) {
    return res.status(400).json({ error: "Missing required query parameters" });
  }
  const query = "SELECT DISTINCT voucher_type FROM voucher_main WHERE company_id = ? AND owner_type = ? AND owner_id = ?";
  db.query(query, [company_id, owner_type, owner_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }
    const types = results.map(r => r.voucher_type);
    res.json(types);
  });
});
module.exports = router;
