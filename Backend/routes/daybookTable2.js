const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  const { company_id, owner_type, owner_id } = req.query;

  if (!company_id || !owner_type || !owner_id) {
    return res
      .status(400)
      .json({ error: "Missing company_id / owner_type / owner_id" });
  }

  try {
    const vouchers = {};

    /* =====================================================
       1️⃣ ACCOUNTING VOUCHERS (voucher_main + voucher_entries)
    ===================================================== */
    const [rows] = await db.query(
      `
      SELECT 
        vm.id AS voucher_id,
        vm.voucher_type,
        vm.voucher_number,
        vm.date,
        vm.narration,
        vm.reference_no,
        vm.supplier_invoice_date,
        vm.company_id,
        vm.owner_type,
        vm.owner_id,

        ve.id AS entry_id,
        ve.ledger_id,
        l.name AS ledger_name,
        ve.amount,
        ve.entry_type,
        ve.narration AS entry_narration,
        ve.item_id

      FROM voucher_main vm
      LEFT JOIN voucher_entries ve ON vm.id = ve.voucher_id
      LEFT JOIN ledgers l ON l.id = ve.ledger_id
      WHERE vm.company_id = ?
        AND vm.owner_type = ?
        AND vm.owner_id = ?
      ORDER BY vm.date DESC, vm.id DESC, ve.id ASC
      `,
      [company_id, owner_type, owner_id]
    );

    rows.forEach((row) => {
      const key = `ACC-${row.voucher_id}`;
      if (!vouchers[key]) {
        vouchers[key] = {
          id: key,
          voucher_type: row.voucher_type,
          voucher_number: row.voucher_number,
          date: row.date,
          narration: row.narration,
          reference_no: row.reference_no,
          supplier_invoice_date: row.supplier_invoice_date,
          company_id: row.company_id,
          owner_type: row.owner_type,
          owner_id: row.owner_id,
          entries: [],
        };
      }

      if (row.entry_id) {
        vouchers[key].entries.push({
          id: row.entry_id,
          ledger_id: row.ledger_id,
          ledger_name: row.ledger_name,
          amount: row.amount,
          entry_type: row.entry_type,
          narration: row.entry_narration,
          item_id: row.item_id,
        });
      }
    });

    /* =====================================================
       2️⃣ PURCHASE VOUCHERS → DEBIT
    ===================================================== */

    const [purchaseRows] = await db.query(
      `
  SELECT
    pv.partyId,
    party.name AS party_name,
    pv.purchaseLedgerId,
    pv.number AS voucher_number,
    pl.name AS purchase_ledger_name,
    SUM(pv.total) AS total_amount
  FROM purchase_vouchers pv
  LEFT JOIN ledgers party ON party.id = pv.partyId
  LEFT JOIN ledgers pl ON pl.id = pv.purchaseLedgerId
  WHERE pv.company_id = ?
    AND pv.owner_type = ?
    AND pv.owner_id = ?
  GROUP BY pv.partyId, pv.purchaseLedgerId
  `,
      [company_id, owner_type, owner_id]
    );

    purchaseRows.forEach((row) => {
      const key = `PUR-${row.partyId}`;

      // 🟢 CREATE VOUCHER ONCE PER PARTY
      if (!vouchers[key]) {
        vouchers[key] = {
          id: key,
          voucher_type: "Purchase Register",
          voucher_number: row.voucher_number,
          date: null,
          narration: null,
          reference_no: null,
          supplier_invoice_date: null,
          company_id,
          owner_type,
          owner_id,
          partyId: row.partyId,
          partyName: row.party_name,
          entries: [],
        };

        // 🔴 PARTY ENTRY → CREDIT
        vouchers[key].entries.push({
          id: `PUR-P-${row.partyId}`,
          ledger_id: row.partyId,
          ledger_name: row.party_name,
          amount: 0, // total later
          entry_type: "credit",
          narration: "Purchase Register",
          isParty: true,
        });
      }

      // 🟡 PURCHASE LEDGER → DEBIT
      vouchers[key].entries.push({
        id: `PUR-L-${row.partyId}-${row.purchaseLedgerId}`,
        ledger_id: row.purchaseLedgerId,
        ledger_name: row.purchase_ledger_name,
        amount: Number(row.total_amount),
        entry_type: "debit",
        narration: null,
        isParty: false,
      });

      // 🔵 UPDATE PARTY CREDIT TOTAL
      const partyEntry = vouchers[key].entries.find((e) => e.isParty);
      if (partyEntry) {
        partyEntry.amount += Number(row.total_amount);
      }
    });

    /* =====================================================
       3️⃣ SALES VOUCHERS → CREDIT
    ===================================================== */
    const [salesRows] = await db.query(
      `
  SELECT
    sv.partyId,
    party.name AS party_name,
    sv.salesLedgerId,
    sv.number AS voucher_number,
    sl.name AS sales_ledger_name,
    SUM(sv.total) AS total_amount
  FROM sales_vouchers sv
  LEFT JOIN ledgers party ON party.id = sv.partyId
  LEFT JOIN ledgers sl ON sl.id = sv.salesLedgerId
  WHERE sv.company_id = ?
    AND sv.owner_type = ?
    AND sv.owner_id = ?
    AND sv.type = 'sales'
    AND sv.isQuotation = 0
  GROUP BY sv.partyId, sv.salesLedgerId
  `,
      [company_id, owner_type, owner_id]
    );

    salesRows.forEach((row) => {
      const key = `SAL-${row.partyId}`;

      // 🟢 CREATE VOUCHER ONCE PER PARTY
      if (!vouchers[key]) {
        vouchers[key] = {
          id: key,
          voucher_type: "Sales Register",
          voucher_number: row.voucher_number,
          date: null,
          narration: null,
          reference_no: null,
          supplier_invoice_date: null,
          company_id,
          owner_type,
          owner_id,
          partyId: row.partyId,
          partyName: row.party_name,
          entries: [],
        };

        // 🔴 PARTY → DEBIT
        vouchers[key].entries.push({
          id: `SAL-P-${row.partyId}`,
          ledger_id: row.partyId,
          ledger_name: row.party_name,
          amount: 0,
          entry_type: "debit",
          narration: "Sales Register",
          isParty: true,
        });
      }

      // 🟡 SALES LEDGER → CREDIT
      vouchers[key].entries.push({
        id: `SAL-L-${row.partyId}-${row.salesLedgerId}`,
        ledger_id: row.salesLedgerId,
        ledger_name: row.sales_ledger_name,
        amount: Number(row.total_amount),
        entry_type: "credit",
        narration: null,
        isParty: false,
      });

      // 🔵 UPDATE PARTY DEBIT TOTAL
      const partyEntry = vouchers[key].entries.find((e) => e.isParty);
      if (partyEntry) {
        partyEntry.amount += Number(row.total_amount);
      }
    });

    /* =====================================================
   4️⃣ DEBIT NOTE VOUCHERS (Debit Note Register)
===================================================== */
    const [debitNoteRows] = await db.query(
      `
  SELECT
    dnv.id,
    dnv.date,
    dnv.number,
    dnv.mode,
    dnv.narration,
    dnv.company_id,
    dnv.owner_type,
    dnv.owner_id
  FROM debit_note_vouchers dnv
  WHERE dnv.company_id = ?
    AND dnv.owner_type = ?
    AND dnv.owner_id = ?
  ORDER BY dnv.date DESC, dnv.id DESC
  `,
      [company_id, owner_type, owner_id]
    );

    for (const dn of debitNoteRows) {
      let entries = [];

      if (dn.narration) {
        try {
          const parsed = JSON.parse(dn.narration);

          if (Array.isArray(parsed.accountingEntries)) {
            // 🔹 Ledger names fetch
            const ledgerIds = parsed.accountingEntries.map((e) => e.ledgerId);

            let ledgerMap = {};
            if (ledgerIds.length) {
              const [ledgerRows] = await db.query(
                `SELECT id, name FROM ledgers WHERE id IN (?)`,
                [ledgerIds]
              );
              ledgerRows.forEach((l) => {
                ledgerMap[l.id] = l.name;
              });
            }

            entries = parsed.accountingEntries.map((e, idx) => ({
              id: `DN-E-${dn.id}-${idx + 1}`,
              ledger_id: e.ledgerId,
              ledger_name: ledgerMap[e.ledgerId] || `Ledger ${e.ledgerId}`,
              amount: e.amount,
              entry_type: e.type, // debit / credit
              narration: parsed.note || "",
              item_id: null,
            }));
          }
        } catch (err) {
          console.warn("Debit note narration JSON parse failed", err);
        }
      }

      vouchers[`DN-${dn.id}`] = {
        id: `DN-${dn.id}`,
        voucher_type: "Debit Note",
        voucher_number: dn.number,
        date: dn.date,
        narration: "",
        reference_no: dn.mode,
        supplier_invoice_date: null,
        company_id: dn.company_id,
        owner_type: dn.owner_type,
        owner_id: dn.owner_id,
        entries,
      };
    }

    /* =====================================================
   4️⃣ CREDIT NOTE VOUCHERS
===================================================== */
    const [creditRows] = await db.query(
      `
  SELECT
    cv.id,
    cv.date,
    cv.number,
    cv.mode,
    cv.partyId,
    cv.narration,
    cv.company_id,
    cv.owner_type,
    cv.owner_id
  FROM credit_vouchers cv
  WHERE cv.company_id = ?
    AND cv.owner_type = ?
    AND cv.owner_id = ?
  ORDER BY cv.date DESC, cv.id DESC
  `,
      [company_id, owner_type, owner_id]
    );

    for (const cv of creditRows) {
      let entries = [];
      let narrationText = "";

      if (cv.narration) {
        try {
          const parsed = JSON.parse(cv.narration);
          narrationText = parsed.note || "";

          if (Array.isArray(parsed.accountingEntries)) {
            const ledgerIds = parsed.accountingEntries.map((e) => e.ledgerId);

            // 🔹 FETCH LEDGER NAMES
            let ledgerMap = {};
            if (ledgerIds.length > 0) {
              const [ledgerRows] = await db.query(
                `SELECT id, name FROM ledgers WHERE id IN (?)`,
                [ledgerIds]
              );

              ledgerRows.forEach((l) => {
                ledgerMap[l.id] = l.name;
              });
            }

            entries = parsed.accountingEntries.map((e, index) => ({
              id: `CRN-E-${cv.id}-${index}`,
              ledger_id: e.ledgerId,
              ledger_name: ledgerMap[e.ledgerId] || `Ledger ${e.ledgerId}`,
              amount: Number(e.amount),
              entry_type: e.type, // debit / credit
              narration: narrationText,
              item_id: null,
            }));
          }
        } catch (err) {
          narrationText = cv.narration;
        }
      }

      vouchers[`CRN-${cv.id}`] = {
        id: `CRN-${cv.id}`,
        voucher_type: "Credit Note",
        voucher_number: cv.number,
        date: cv.date,
        narration: narrationText,
        reference_no: cv.mode,
        supplier_invoice_date: null,
        company_id: cv.company_id,
        owner_type: cv.owner_type,
        owner_id: cv.owner_id,
        entries,
      };
    }

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */
    res.json(Object.values(vouchers));
  } catch (err) {
    console.error("❌ Error fetching vouchers:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
