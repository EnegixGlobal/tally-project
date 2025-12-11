const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2/promise pool

router.post("/", async (req, res) => {
  let {
    type,
    mode,
    date,
    number,
    narration,
    referenceNo,
    supplierInvoiceDate,
    entries = [],
    owner_type,
    owner_id,
    companyId,
  } = req.body;

  // REQUIRED validation
  if (
    !type ||
    !date ||
    !entries.length ||
    !owner_type ||
    !owner_id ||
    !companyId
  ) {
    console.warn("⚠ Missing required fields:", {
      type,
      date,
      entries: entries.length,
      owner_type,
      owner_id,
      companyId,
    });
    return res.status(400).json({ message: "Missing required fields" });
  }

  // ---------------------------------------------------------
  // SINGLE ENTRY AUTO BALANCE FIX (if only one entry comes)
  // ---------------------------------------------------------
  if (mode === "single-entry" && entries.length === 1) {
    const e = entries[0];

    entries.push({
      id: "AUTO",
      ledgerId: e.ledgerId,
      ledgerName: e.ledgerName || null,
      amount: e.amount,
      type: e.type === "credit" ? "debit" : "credit",
      narration: e.narration || null,
      bankName: e.bankName || null,
      chequeNumber: e.chequeNumber || null,
      costCentreId: e.costCentreId || null,
    });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // ---------------------------------------------------------
    // FIX: CHECK IF ledger_name COLUMN EXISTS (MySQL 5.7 SAFE)
    // ---------------------------------------------------------
    const [colCheck] = await conn.query(`
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'voucher_entries'
        AND COLUMN_NAME = 'ledger_name'
        AND TABLE_SCHEMA = DATABASE();
    `);

    if (colCheck[0].count === 0) {
      console.log("🔧 Adding column: ledger_name");
      await conn.query(`
        ALTER TABLE voucher_entries
        ADD COLUMN ledger_name VARCHAR(255) NULL;
      `);
    }

    // ---------------------------------------------------------
    // INSERT INTO voucher_main
    // ---------------------------------------------------------
    const [mainResult] = await conn.execute(
      `
      INSERT INTO voucher_main 
      (voucher_type, voucher_number, date, narration, reference_no, supplier_invoice_date, owner_type, owner_id, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        type,
        number || null,
        date,
        narration || null,
        referenceNo || null,
        supplierInvoiceDate || null,
        owner_type,
        owner_id,
        companyId,
      ]
    );

    const voucherId = mainResult.insertId;

    // ---------------------------------------------------------
    // INSERT voucher entries
    // ---------------------------------------------------------
    const entryValues = entries.map((e) => [
      voucherId,
      Number(e.ledgerId),
      e.ledgerName || null,
      Number(e.amount) || 0,
      e.type || "credit",
      e.narration || null,
      e.bankName || null,
      e.chequeNumber || null,
      e.costCentreId || null,
    ]);

    await conn.query(
      `
      INSERT INTO voucher_entries 
      (voucher_id, ledger_id, ledger_name, amount, entry_type, narration, bank_name, cheque_number, cost_centre_id)
      VALUES ?
      `,
      [entryValues]
    );

    await conn.commit();
    conn.release();

    return res.status(200).json({
      success: true,
      message: "Voucher saved successfully",
      voucherId,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();

    console.error("❌ Insert Failed:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to save voucher",
      error: err.message,
    });
  }
});


router.get("/", async (req, res) => {
  const { ownerType, ownerId, voucherType } = req.query;

  if (!ownerType || !ownerId || !voucherType) {
    return res
      .status(400)
      .json({ message: "ownerType, ownerId, voucherType required" });
  }


  try {
    // Create ledger_name column if missing (without IF NOT EXISTS for full support)
    await db
      .query(
        `
      ALTER TABLE voucher_entries 
      ADD COLUMN ledger_name VARCHAR(255) NULL;
    `
      )
      .catch(() => {}); // ignore error if column already exists

    // 1️⃣ Fetch vouchers
    const [vouchers] = await db.execute(
      `SELECT v.id, v.voucher_number AS number, v.voucher_type AS type, 
              v.date, v.reference_no, v.narration
       FROM voucher_main v
       WHERE v.owner_type = ? AND v.owner_id = ? AND v.voucher_type = ?
       ORDER BY v.date DESC, v.id DESC`,
      [ownerType, ownerId, voucherType]
    );

    const voucherIds = vouchers.map((v) => v.id);
    let entries = [];

    // 2️⃣ Fetch entries including ledgerName
    if (voucherIds.length > 0) {
      const placeholders = voucherIds.map(() => "?").join(",");

      const [entryRows] = await db.query(
        `
        SELECT 
          e.id,
          e.voucher_id,
          e.ledger_id,
          e.ledger_name,  
          e.amount,
          e.entry_type AS type,
          e.narration,
          e.bank_name,
          e.cheque_number,
          e.cost_centre_id
        FROM voucher_entries e
        WHERE e.voucher_id IN (${placeholders})
        ORDER BY e.id
        `,
        voucherIds
      );

      entries = entryRows;
    }

    // 3️⃣ Attach entries to vouchers
    const result = vouchers.map((voucher) => ({
      ...voucher,
      entries: entries
        .filter((e) => e.voucher_id === voucher.id)
        .map(({ voucher_id, ...rest }) => rest),
    }));

    return res.json({ data: result });
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch vouchers", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    // delete child entries first
    await db.execute("DELETE FROM voucher_entries WHERE voucher_id = ?", [id]);

    // delete main
    const [result] = await db.execute("DELETE FROM voucher_main WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    res.status(200).json({
      success: true,
      message: "Voucher deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting voucher:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete voucher",
    });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Voucher ID is required" });
  }
  const {
    type,
    mode,
    date,
    number,
    narration,
    referenceNo,
    supplierInvoiceDate,
    entries = [],
    ownerType,
    ownerId,
    owner_type,
    owner_id,
  } = req.body;

  // FINAL merged owner values (जो भी आए use करो)
  const finalOwnerType = ownerType || owner_type;
  const finalOwnerId = ownerId || owner_id;

  // VALIDATION FIXED
  if (!type || !date || !entries.length || !finalOwnerType || !finalOwnerId) {
    return res.status(400).json({
      message: "Missing required fields (ownerType or ownerId is missing)",
    });
  }

  // Auto-fix for single-entry mode
  if (mode === "single-entry" && entries.length === 1) {
    const debitEntry = entries[0];

    const balancingEntry = {
      id: "auto",
      ledgerId: debitEntry.ledgerId,
      amount: debitEntry.amount,
      type: debitEntry.type === "debit" ? "credit" : "debit",
      narration: debitEntry.narration || null,
      bankName: debitEntry.bankName || null,
      chequeNumber: debitEntry.chequeNumber || null,
      costCentreId: debitEntry.costCentreId || null,
    };

    entries.push(balancingEntry);
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // ---------------------------------------
    // 1️⃣ UPDATE voucher_main
    // ---------------------------------------
    await conn.execute(
      `
      UPDATE voucher_main
      SET voucher_type = ?, voucher_number = ?, date = ?, narration = ?, 
          reference_no = ?, supplier_invoice_date = ?, owner_type = ?, owner_id = ?
      WHERE id = ?
      `,
      [
        type,
        number || null,
        date,
        narration || null,
        referenceNo || null,
        supplierInvoiceDate || null,
        finalOwnerType, // FIXED
        finalOwnerId, // FIXED
        id,
      ]
    );

    // ---------------------------------------
    // 2️⃣ DELETE old entries
    // ---------------------------------------
    await conn.execute("DELETE FROM voucher_entries WHERE voucher_id = ?", [
      id,
    ]);

    // ---------------------------------------
    // 3️⃣ INSERT updated entries
    // ---------------------------------------
    const entryValues = entries.map((entry) => [
      id,
      Number(entry.ledgerId),
      parseFloat(entry.amount || 0),
      entry.type || "debit",
      entry.narration || null,
      entry.bankName || null,
      entry.chequeNumber || null,
      entry.costCentreId || null,
    ]);

    await conn.query(
      `
      INSERT INTO voucher_entries
      (voucher_id, ledger_id, amount, entry_type, narration, bank_name, cheque_number, cost_centre_id)
      VALUES ?
      `,
      [entryValues]
    );

    await conn.commit();
    conn.release();

    res.status(200).json({
      success: true,
      message: "Voucher updated successfully",
      voucherId: id,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("❌ Update failed:", err);

    res.status(500).json({
      success: false,
      message: "Failed to update voucher",
      error: err.message,
    });
  }
});


router.get("/:id", async (req, res) => {
  const { id } = req.params;
  // Validate
  if (!id) {
    return res.status(400).json({ message: "Voucher ID is required" });
  }

  try {
    // ---------------------------------------
    // 1️⃣ Get voucher_main record
    // ---------------------------------------
    const [voucherRows] = await db.execute(
      `
      SELECT 
        v.id,
        v.voucher_number AS number,
        v.voucher_type AS type,
        v.date,
        v.narration,
        v.reference_no,
        v.supplier_invoice_date,
        v.owner_type,
        v.owner_id
      FROM voucher_main v 
      WHERE v.id = ?
      `,
      [id]
    );

    if (voucherRows.length === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const voucher = voucherRows[0];

    // ---------------------------------------
    // 2️⃣ Get entries for this voucher
    // ---------------------------------------
    const [entryRows] = await db.execute(
      `
      SELECT 
        e.id,
        e.ledger_id,
        e.amount,
        e.entry_type AS type,
        e.narration,
        e.bank_name,
        e.cheque_number,
        e.cost_centre_id
      FROM voucher_entries e
      WHERE e.voucher_id = ?
      ORDER BY e.id ASC
      `,
      [id]
    );

    // ---------------------------------------
    // 3️⃣ Final response
    // ---------------------------------------
    return res.status(200).json({
      data: {
        ...voucher,
        entries: entryRows,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching voucher:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch voucher",
      error: error.message,
    });
  }
});

module.exports = router;
