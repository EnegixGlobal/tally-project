const express = require("express");
const router = express.Router();
const db = require("../db");

/* ======================================================
   🔹 POST : SAVE CREDIT NOTE
====================================================== */
router.post("/", async (req, res) => {
  try {
    const {
      companyId,
      ownerType,
      ownerId,
      date,
      number,
      mode,
      partyId,
      narration,
      entries,
    } = req.body;

    if (!companyId || !ownerType || !ownerId || !date || !mode) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    /* =========================
       🧠 PREPARE FINAL NARRATION
    ========================= */
    let finalNarration = narration || "";

    if (
      (mode === "accounting-invoice" || mode === "as-voucher") &&
      Array.isArray(entries)
    ) {
      const cleanAccountingEntries = entries
        .filter(
          (e) =>
            e.ledgerId &&
            Number(e.amount) > 0 &&
            (e.type === "debit" || e.type === "credit")
        )
        .map((e) => ({
          ledgerId: Number(e.ledgerId),
          type: e.type,
          amount: Number(e.amount),
        }));

      finalNarration = JSON.stringify({
        accountingEntries: cleanAccountingEntries,
        note: narration || "",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO credit_vouchers
      (company_id, owner_type, owner_id, date, number, mode, partyId, narration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        companyId,
        ownerType,
        ownerId,
        date,
        number || null,
        mode,
        partyId || null,
        finalNarration,
      ]
    );

    res.json({
      success: true,
      message: "Credit Note saved successfully",
      voucherId: result.insertId,
    });
  } catch (error) {
    console.error("Error saving credit note:", error);
    res.status(500).json({
      success: false,
      message: "Error saving Credit Note",
      error: error.message,
    });
  }
});

/* ======================================================
   🔹 GET : FETCH CREDIT NOTES (REGISTER)
====================================================== */
router.get("/", async (req, res) => {
  try {
    const { companyId, ownerType, ownerId, fromDate, toDate } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (companyId) {
      whereClause += " AND cv.company_id = ?";
      params.push(companyId);
    }
    if (ownerType) {
      whereClause += " AND cv.owner_type = ?";
      params.push(ownerType);
    }
    if (ownerId) {
      whereClause += " AND cv.owner_id = ?";
      params.push(ownerId);
    }
    if (fromDate) {
      whereClause += " AND cv.date >= ?";
      params.push(fromDate);
    }
    if (toDate) {
      whereClause += " AND cv.date <= ?";
      params.push(toDate);
    }

    const [rows] = await db.query(
      `
      SELECT
        cv.id,
        cv.date,
        cv.number,
        cv.mode,
        cv.partyId,
        cv.narration
      FROM credit_vouchers cv
      ${whereClause}
      ORDER BY cv.date DESC, cv.id DESC
      `,
      params
    );

    const data = rows.map((r) => {
      let entries = [];
      let narrationText = "";

      if (
        (r.mode === "accounting-invoice" || r.mode === "as-voucher") &&
        r.narration
      ) {
        try {
          const parsed = JSON.parse(r.narration);
          entries = parsed.accountingEntries || [];
          narrationText = parsed.note || "";
        } catch {
          narrationText = r.narration;
        }
      }

      return {
        id: r.id,
        date: r.date,
        number: r.number,
        mode: r.mode,
        partyId: r.partyId,
        narration: narrationText,
        entries,
        total: entries.reduce((s, e) => s + Number(e.amount || 0), 0),
      };
    });

    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("Error fetching credit notes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Credit Notes",
      error: error.message,
    });
  }
});

/* ======================================================
   🔹 GET : FETCH SINGLE CREDIT NOTE (EDIT)
====================================================== */
router.get("/:id", async (req, res) => {
  const { companyId, ownerType, ownerId } = req.query;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({
      success: false,
      message: "companyId, ownerType, ownerId required",
    });
  }

  const [rows] = await db.query(
    `
    SELECT *
    FROM credit_vouchers
    WHERE id = ?
      AND company_id = ?
      AND owner_type = ?
      AND owner_id = ?
    `,
    [req.params.id, companyId, ownerType, ownerId]
  );

  if (!rows.length) {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  const v = rows[0];
  let entries = [];
  let narrationText = "";

  try {
    const parsed = JSON.parse(v.narration);
    entries = parsed.accountingEntries || [];
    narrationText = parsed.note || "";
  } catch {
    narrationText = v.narration;
  }

  res.json({
    success: true,
    data: {
      ...v,
      narration: narrationText,
      entries,
    },
  });
});

/* ======================================================
   🔹 PUT : UPDATE CREDIT NOTE
====================================================== */
router.put("/:id", async (req, res) => {
  try {
    const {
      companyId,
      ownerType,
      ownerId,
      date,
      number,
      mode,
      narration,
      entries,
    } = req.body;


    if (!companyId || !ownerType || !ownerId || !mode) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let finalNarration = narration || "";

    if (
      (mode === "accounting-invoice" || mode === "as-voucher") &&
      Array.isArray(entries)
    ) {
      const cleanAccountingEntries = entries
        .filter(
          (e) =>
            e.ledgerId &&
            Number(e.amount) > 0 &&
            (e.type === "debit" || e.type === "credit")
        )
        .map((e) => ({
          ledgerId: Number(e.ledgerId),
          type: e.type,
          amount: Number(e.amount),
        }));

      finalNarration = JSON.stringify({
        accountingEntries: cleanAccountingEntries,
        note: narration || "",
      });
    }

    await db.query(
      `
      UPDATE credit_vouchers
      SET
        date = ?,
        number = ?,
        mode = ?,
        narration = ?
      WHERE id = ?
        AND company_id = ?
        AND owner_type = ?
        AND owner_id = ?
      `,
      [
        date,
        number || null,
        mode,
        finalNarration,
        req.params.id,
        companyId,
        ownerType,
        ownerId,
      ]
    );

    res.json({
      success: true,
      message: "Credit Note updated successfully",
    });
  } catch (error) {
    console.error("Error updating credit note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update Credit Note",
      error: error.message,
    });
  }
});

/* ======================================================
   🔹 DELETE : REMOVE CREDIT NOTE
====================================================== */
router.delete("/:id", async (req, res) => {
  const { companyId, ownerType, ownerId } = req.query;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ success: false });
  }

  await db.query(
    `
    DELETE FROM credit_vouchers
    WHERE id = ?
      AND company_id = ?
      AND owner_type = ?
      AND owner_id = ?
    `,
    [req.params.id, companyId, ownerType, ownerId]
  );

  res.json({ success: true, message: "Credit Note deleted" });
});

module.exports = router;
