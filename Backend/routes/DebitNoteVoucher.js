const express = require("express");
const db = require("../db");

const router = express.Router();

/* ======================================================
   🔹 POST : SAVE DEBIT NOTE (Voucher + Entries)
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
      salesLedgerId,
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

    // ✅ FIX: as-voucher + accounting-invoice BOTH SUPPORTED
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

    /* =========================
       INSERT INTO SAME TABLE
    ========================= */
    const [voucherResult] = await db.query(
      `
      INSERT INTO debit_note_vouchers
      (company_id, owner_type, owner_id, date, number, mode, party_id, sales_ledger_id, narration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        companyId,
        ownerType,
        ownerId,
        date,
        number || null,
        mode,
        partyId || null,
        salesLedgerId || null,
        finalNarration,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Debit Note saved successfully",
      voucherId: voucherResult.insertId,
    });
  } catch (error) {
    console.error("Error saving debit note:", error);
    res.status(500).json({
      success: false,
      message: "Error saving debit note",
      error: error.message,
    });
  }
});

/* ======================================================
   🔹 GET : FETCH DEBIT NOTES (with entries)
====================================================== */
router.get("/", async (req, res) => {
  try {
    const { companyId, ownerType, ownerId, fromDate, toDate } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (companyId) {
      whereClause += " AND dnv.company_id = ?";
      params.push(companyId);
    }
    if (ownerType) {
      whereClause += " AND dnv.owner_type = ?";
      params.push(ownerType);
    }
    if (ownerId) {
      whereClause += " AND dnv.owner_id = ?";
      params.push(ownerId);
    }
    if (fromDate) {
      whereClause += " AND dnv.date >= ?";
      params.push(fromDate);
    }
    if (toDate) {
      whereClause += " AND dnv.date <= ?";
      params.push(toDate);
    }

    const [rows] = await db.query(
      `
      SELECT
        dnv.id,
        dnv.date,
        dnv.number,
        dnv.mode,
        dnv.party_id AS partyId,
        dnv.sales_ledger_id AS salesLedgerId,
        dnv.narration
      FROM debit_note_vouchers dnv
      ${whereClause}
      ORDER BY dnv.date DESC, dnv.id DESC
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
      } else {
        narrationText = r.narration || "";
      }

      return {
        id: r.id,
        date: r.date,
        number: r.number,
        mode: r.mode,
        partyId: r.partyId,
        salesLedgerId: r.salesLedgerId,
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
    console.error("Error fetching debit notes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Debit Notes",
      error: error.message,
    });
  }
});

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
    FROM debit_note_vouchers
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

router.put("/:id", async (req, res) => {
  const { companyId, ownerType, ownerId, narration, entries } = req.body;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ success: false });
  }

  const finalNarration = JSON.stringify({
    accountingEntries: entries || [],
    note: narration || "",
  });

  await db.query(
    `
    UPDATE debit_note_vouchers
    SET narration = ?
    WHERE id = ?
      AND company_id = ?
      AND owner_type = ?
      AND owner_id = ?
    `,
    [finalNarration, req.params.id, companyId, ownerType, ownerId]
  );

  res.json({ success: true, message: "Debit Note updated" });
});

router.delete("/:id", async (req, res) => {
  const { companyId, ownerType, ownerId } = req.query;

  if (!companyId || !ownerType || !ownerId) {
    return res.status(400).json({ success: false });
  }

  await db.query(
    `
    DELETE FROM debit_note_vouchers
    WHERE id = ?
      AND company_id = ?
      AND owner_type = ?
      AND owner_id = ?
    `,
    [req.params.id, companyId, ownerType, ownerId]
  );

  res.json({ success: true, message: "Debit Note deleted" });
});

module.exports = router;
