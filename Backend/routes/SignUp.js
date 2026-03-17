require("dotenv").config(); // Load env variables
const express = require("express");
const router = express.Router();
const db = require("../db"); // already a promise-based pool
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "8fbd@hG35kd93JK!hG2c90MZ";

router.post("/register", async (req, res) => {
  // ✅ Ensure 'address' column exists in all relevant user tables when route is hit
  const userTables = [
    { name: "tbemployees", after: "pan" },
    { name: "tbca", after: "fdpan" },
    { name: "tbcaemployees", after: "adhar" }
  ];

  for (const table of userTables) {
    try {
      const [cols] = await db.query(`SHOW COLUMNS FROM ${table.name} LIKE 'address'`);
      if (cols.length === 0) {
        await db.query(`ALTER TABLE ${table.name} ADD COLUMN address TEXT AFTER ${table.after}`);
      }
    } catch (err) {
      console.error(`Error ensuring address column in ${table.name}:`, err.message);
    }
  }

  const { firstName, lastName, email, phoneNumber, pan, password, userLimit, address } =
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

  console.log(firstName, !lastName, email, password, phoneNumber, pan, userLimit, address);

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
      INSERT INTO tbemployees (firstName, lastName, email, phoneNumber, pan, password, userLimit, token, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      address || null,
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
