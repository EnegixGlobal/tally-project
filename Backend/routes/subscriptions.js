const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all subscription plans
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM subscription_plans ORDER BY id DESC"
    );

    const plans = rows.map(row => ({
      ...row,
      id: row.id.toString(),
      features:
        typeof row.features === "string"
          ? JSON.parse(row.features)
          : row.features,
      price: parseFloat(row.price),
      isActive: Boolean(row.isActive)
    }));

    res.json({ success: true, data: plans });
  } catch (err) {
    console.error("Error fetching subscription plans:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// POST a new subscription plan
router.post("/", async (req, res) => {
  const { name, price, duration, features, isActive } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO subscription_plans 
       (name, price, duration, features, isActive)
       VALUES (?, ?, ?, ?, ?)`,
      [name, price, duration, JSON.stringify(features), isActive]
    );

    res.status(201).json({
      success: true,
      id: result.insertId.toString()
    });
  } catch (err) {
    console.error("Error creating subscription plan:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// UPDATE a subscription plan
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, duration, features, isActive } = req.body;

  try {
    await db.query(
      `UPDATE subscription_plans 
       SET name = ?, price = ?, duration = ?, features = ?, isActive = ?
       WHERE id = ?`,
      [name, price, duration, JSON.stringify(features), isActive, id]
    );

    res.json({ success: true, message: "Plan updated successfully" });
  } catch (err) {
    console.error("Error updating subscription plan:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// DELETE a subscription plan
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      "DELETE FROM subscription_plans WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Subscription plan deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting subscription plan:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;