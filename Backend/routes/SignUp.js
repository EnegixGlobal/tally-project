require("dotenv").config(); // Load env variables
const express = require("express");
const router = express.Router();
const db = require("../db"); // already a promise-based pool
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "8fbd@hG35kd93JK!hG2c90MZ";

router.post("/register", async (req, res) => {
  // console.log("/register hit");

  const { firstName, lastName, email, phoneNumber, pan, password, userLimit } =
    req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !phoneNumber ||
    !pan ||
    !userLimit
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  console.log(firstName, !lastName, email, password, phoneNumber, pan, userLimit);

  try {
    // 🔍 Check if email already exists
    const [existing] = await db.query(
      `SELECT id FROM tbemployees WHERE email = ?`,
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered" }); // 409 = Conflict
    }

    // 🔒 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 📌 Generate JWT token
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

    // 📥 Insert into DB
    const sql = `
      INSERT INTO tbemployees (firstName, lastName, email, phoneNumber, pan, password, userLimit, token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      firstName,
      lastName,
      email,
      phoneNumber,
      pan,
      hashedPassword,
      userLimit,
      token,
    ]);

    console.log("✅ User inserted:", result.insertId);

    return res.status(200).json({
      message: "User registered successfully",
      userId: result.insertId,
      token,
    });
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    return res
      .status(500)
      .json({ message: "Database error", error: err.message });
  }
});

module.exports = router;
