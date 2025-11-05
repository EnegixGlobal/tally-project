// routes/company.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // your mysql2 connection

// GET /api/companyinfo/:id
router.get("/:id", async (req, res) => {
  const companyId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT c.name, c.fdAccountType , a.fdname as AccountantName
       FROM tbcompanies c
       LEFT JOIN tbca a ON c.fdAccountantName = a.fdSiNo
       WHERE c.id = ?`,
      [companyId]
    );

    const companyData = rows[0];
    if (!companyData) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json(companyData);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});
module.exports = router;
