const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2/promise pool

router.post("/", async (req, res) => {
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
  } = req.body;

  // 🔸 Required field validation
  if (!type || !date || !entries.length || !ownerType || !ownerId) {
    console.warn("⚠️ Missing required fields:", {
      type,
      date,
      entries: entries.length,
      ownerType,
      ownerId,
    });
    return res.status(400).json({ message: "Missing required fields" });
  }

  // 🧩 Auto-fix for single-entry mode
  if (mode === "single-entry" && entries.length === 1) {
    const debitEntry = entries[0];

    // ✅ Prevent same ledger for both sides (credit side alag hona chahiye)
    const oppositeLedgerId =
      debitEntry.ledgerId === req.body.ledgerId
        ? null
        : req.body.ledgerId || debitEntry.ledgerId;

    const balancingEntry = {
      id: "auto",
      ledgerId: oppositeLedgerId,
      amount: debitEntry.amount,
      type: debitEntry.type === "debit" ? "credit" : "debit",
      narration: debitEntry.narration || null,
      bankName: debitEntry.bankName || null,
      chequeNumber: debitEntry.chequeNumber || null,
      costCentreId: debitEntry.costCentreId || null,
    };

    entries.push(balancingEntry);
  }

  // 🧠 Database transaction start
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // ✅ Insert voucher main record
    const [voucherResult] = await conn.execute(
      `
      INSERT INTO voucher_main 
      (voucher_type, voucher_number, date, narration, reference_no, supplier_invoice_date, owner_type, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        type,
        number || null,
        date,
        narration || null,
        referenceNo || null,
        supplierInvoiceDate || null,
        ownerType,
        ownerId,
      ]
    );

    const voucherId = voucherResult.insertId;

    // ✅ Prepare entry values
    const entryValues = entries.map((entry) => [
      voucherId,
      Number(entry.ledgerId),
      parseFloat(entry.amount || 0),
      entry.type || "debit",
      entry.narration || null,
      entry.bankName || null,
      entry.chequeNumber || null,
      entry.costCentreId || null,
    ]);

    // ✅ Insert into voucher_entries
    const [entryResult] = await conn.query(
      `
      INSERT INTO voucher_entries 
      (voucher_id, ledger_id, amount, entry_type, narration, bank_name, cheque_number, cost_centre_id)
      VALUES ?
      `,
      [entryValues]
    );

    // ✅ Commit transaction
    await conn.commit();
    conn.release();

    // ✅ Response
    res.status(200).json({
      success: true,
      message: `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } voucher saved successfully`,
      voucherId,
      entriesInserted: entryResult.affectedRows,
    });
  } catch (err) {
    // ❌ Rollback on error
    await conn.rollback();
    conn.release();
    console.error("❌ Database insert failed:", err);

    res.status(500).json({
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

    if (voucherIds.length > 0) {
      const [entryRows] = await db.query(
        `SELECT e.id, e.voucher_id, e.ledger_id, e.amount, 
                e.entry_type AS type, e.narration
         FROM voucher_entries e
         WHERE e.voucher_id IN (${voucherIds.map(() => "?").join(",")})
         ORDER BY e.id`,
        voucherIds
      );

      entries = entryRows;
    }

    const result = vouchers.map((voucher) => ({
      ...voucher,
      entries: entries
        .filter((e) => e.voucher_id === voucher.id)
        .map(({ voucher_id, ...rest }) => rest), // voucher_id remove kar diya
    }));

    res.json({ data: result });
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    res
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

    const [result] = await db.execute("DELETE FROM voucher_main WHERE id = ?", [
      id,
    ]);

    if (result.offectedRows === 0) {
      return res.status(404).json({ message: "Voucher not found " });
    }

    res.status(200).json({
      message: "Voucher deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting voucher:", error);
    res.status(500).json({
      message: "Faild to delete voucher",
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
  } = req.body;

  // 🔸 Validation
  if (!type || !date || !entries.length || !ownerType || !ownerId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // 🧩 Auto-fix for single-entry mode
  if (mode === "single-entry" && entries.length === 1) {
    const debitEntry = entries[0];

    const oppositeLedgerId =
      debitEntry.ledgerId === req.body.ledgerId
        ? null
        : req.body.ledgerId || debitEntry.ledgerId;

    const balancingEntry = {
      id: "auto",
      ledgerId: oppositeLedgerId,
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
        ownerType,
        ownerId,
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
    // 3️⃣ INSERT new entries
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

    // ---------------------------------------
    // 4️⃣ COMMIT TRANSACTION
    // ---------------------------------------
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
