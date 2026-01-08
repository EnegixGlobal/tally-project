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

    if (mode !== "item-invoice" && Array.isArray(entries)) {
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
      });
    }

    /* =========================
       1️⃣ INSERT VOUCHER
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

    const voucherId = voucherResult.insertId;

    /* =========================
       2️⃣ ITEM-INVOICE ENTRIES ONLY
    ========================= */
    if (mode === "item-invoice" && Array.isArray(entries)) {
      for (const entry of entries) {
        if (!entry.itemId || Number(entry.quantity) <= 0) continue;

        await db.query(
          `
          INSERT INTO debit_note_entries
          (voucher_id, item_id, hsn_code, quantity, unit, rate, discount, amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            voucherId,
            Number(entry.itemId),
            entry.hsnCode || "",
            Number(entry.quantity),
            entry.unit || "",
            Number(entry.rate || 0),
            Number(entry.discount || 0),
            Number(entry.amount || 0),
          ]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Debit Note saved successfully",
      voucherId,
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
        dnv.id AS voucherId,
        dnv.date,
        dnv.number,
        dnv.mode,
        dnv.party_id AS partyId,
        dnv.sales_ledger_id AS salesLedgerId,
        dnv.narration,

        dne.id AS entryId,
        dne.item_id,
        dne.hsn_code,
        dne.quantity,
        dne.unit,
        dne.rate,
        dne.discount,
        dne.amount

      FROM debit_note_vouchers dnv
      LEFT JOIN debit_note_entries dne
        ON dne.voucher_id = dnv.id

      ${whereClause}
      ORDER BY dnv.date DESC, dnv.id DESC
      `,
      params
    );

    const map = {};

    rows.forEach((r) => {
      /* ============================
         1️⃣ INIT VOUCHER
      ============================ */
      if (!map[r.voucherId]) {
        map[r.voucherId] = {
          id: r.voucherId,
          date: r.date,
          number: r.number,
          mode: r.mode,
          partyId: r.partyId,
          salesLedgerId: r.salesLedgerId,
          narration: "",
          entries: [],
          total: 0,
        };

        /* ============================
           2️⃣ ACCOUNTING / AS-VOUCHER
        ============================ */
        if (r.mode !== "item-invoice" && r.narration) {
          try {
            const parsed = JSON.parse(r.narration);

            const accountingEntries = Array.isArray(
              parsed.accountingEntries
            )
              ? parsed.accountingEntries
              : [];

            map[r.voucherId].entries = accountingEntries.map((e) => ({
              ledgerId: e.ledgerId,
              type: e.type,
              amount: Number(e.amount || 0),
            }));

            map[r.voucherId].total = map[
              r.voucherId
            ].entries.reduce(
              (sum, e) => sum + Number(e.amount || 0),
              0
            );

            map[r.voucherId].narration = parsed.text || "";
          } catch (err) {
            // fallback if narration is plain text
            map[r.voucherId].narration = r.narration;
          }
        } else {
          map[r.voucherId].narration = r.narration || "";
        }
      }

      /* ============================
         3️⃣ ITEM-INVOICE ENTRIES
      ============================ */
      if (r.mode === "item-invoice" && r.entryId) {
        map[r.voucherId].entries.push({
          id: r.entryId,
          itemId: r.item_id,
          hsnCode: r.hsn_code,
          quantity: Number(r.quantity || 0),
          unit: r.unit,
          rate: Number(r.rate || 0),
          discount: Number(r.discount || 0),
          amount: Number(r.amount || 0),
        });

        map[r.voucherId].total += Number(r.amount || 0);
      }
    });

    res.json({
      success: true,
      data: Object.values(map),
      count: Object.keys(map).length,
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



module.exports = router;
