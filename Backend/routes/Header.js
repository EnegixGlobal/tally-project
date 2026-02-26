// routes/company.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // your mysql2 connection

// GET /api/companyinfo/:id
router.get("/:id", async (req, res) => {
  const companyId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT c.name, c.fdAccountType, c.fdAccountantName, a.fdname as JoinedAccountantName
       FROM tbcompanies c
       LEFT JOIN tbca a ON CAST(c.fdAccountantName AS CHAR) = CAST(a.fdSiNo AS CHAR) OR c.fdAccountantName = a.fdname
       WHERE c.id = ?`,
      [companyId]
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: "Company not found" });
    }
    // Prioritize the name from the join, then the raw field, then null
    const accountantNameValue = row.JoinedAccountantName || row.fdAccountantName || "";

    const companyData = {
      name: row.name,
      fdAccountType: row.fdAccountType,
      AccountantName: accountantNameValue,
      accountantName: accountantNameValue,
      CAName: accountantNameValue
    };

    res.json(companyData);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});
module.exports = router;
