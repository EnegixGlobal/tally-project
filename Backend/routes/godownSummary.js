const express = require("express");
const router = express.Router();
const pool = require("../db"); // your mysql2 pool connection

router.get("/api/godown-summary", async (req, res) => {
  try {
    const { godownId, asOnDate, company_id, owner_type, owner_id } = req.query;
    console.log("hit hua", company_id, owner_type, owner_id);

    if (!company_id || !owner_type || !owner_id) {
      return res
        .status(400)
        .json({
          error: "Missing tenant parameters (company_id, owner_type, owner_id)",
        });
    }

    // Base query: join godown_allocations with stock_items and godowns
    let sql = `
      SELECT
        g.id as godownId,
        g.name as godownName,
        si.id as itemId,
        si.name as itemName,
        si.unit,
        ga.quantity,
        IFNULL(si.standardPurchaseRate, 0) as rate,
        (ga.quantity * IFNULL(si.standardPurchaseRate, 0)) as value
      FROM godown_allocations ga
      JOIN stock_items si ON ga.stockItemId = si.id
      JOIN godowns g ON ga.godownId = g.id
      WHERE ga.company_id = ?
        AND ga.owner_type = ?
        AND ga.owner_id = ?
    `;

    const params = [company_id, owner_type, owner_id];

    if (godownId) {
      sql += " AND g.id = ?";
      params.push(godownId);
    }

    // TODO if you want to filter asOnDate, you must maintain history in godown_allocations or similar

    sql += " ORDER BY g.name, si.name";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching godown summary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
