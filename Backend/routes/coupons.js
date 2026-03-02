const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all coupons
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM subscription_coupons ORDER BY id DESC"
    );

    const coupons = rows.map(row => ({
      ...row,
      id: row.id.toString(),
      discountValue: parseFloat(row.discountValue),
      isActive: Boolean(row.isActive)
    }));

    res.json({ success: true, data: coupons });
  } catch (err) {
    console.error("Error fetching coupons:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// POST a new coupon
router.post("/", async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    applicableDuration,
    expiryDate,
    maxUses,
    isActive
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO subscription_coupons 
       (code, discountType, discountValue, applicableDuration, expiryDate, maxUses, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        discountType,
        discountValue,
        applicableDuration || "all",
        expiryDate || null,
        maxUses || 0,
        isActive
      ]
    );

    res.status(201).json({
      success: true,
      id: result.insertId.toString()
    });
  } catch (err) {
    console.error("Error creating coupon:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ success: false, error: "Coupon code already exists" });
    }

    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// DELETE a coupon
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      "DELETE FROM subscription_coupons WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Coupon deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting coupon:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Toggle coupon status
router.patch("/:id/toggle", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT isActive FROM subscription_coupons WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Coupon not found" });
    }

    const newStatus = !rows[0].isActive;

    await db.query(
      "UPDATE subscription_coupons SET isActive = ? WHERE id = ?",
      [newStatus, id]
    );

    res.json({ success: true, isActive: newStatus });
  } catch (err) {
    console.error("Error toggling coupon:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;