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
    pv.id AS voucher_id,

    pv.partyId,
    party.name AS party_name,

    pv.number AS voucher_number,
    pv.date AS voucher_date,

    pv.subtotal,
    pv.cgstTotal,
    pv.sgstTotal,
    pv.igstTotal,
    pv.tdsTotal,
    pv.total,

    pi.purchaseLedgerId,
    l.name AS purchase_ledger_name,

    pi.amount AS item_amount

  FROM purchase_vouchers pv

  LEFT JOIN purchase_voucher_items pi
    ON pi.voucherId = pv.id

  LEFT JOIN ledgers l
    ON l.id = pi.purchaseLedgerId

  LEFT JOIN ledgers party
    ON party.id = pv.partyId

  WHERE pv.company_id = ?
    AND pv.owner_type = ?
    AND pv.owner_id = ?

  GROUP BY pv.id, pi.id
  `,
      [company_id, owner_type, owner_id]
    );

    purchaseRows.forEach((row) => {
      const key = `PUR-${row.voucher_id}`;

      /* ================================
         1. CREATE VOUCHER (If Not Exists)
      ================================= */
      if (!vouchers[key]) {
        vouchers[key] = {
          id: key,
          voucher_type: "purchase",
          voucher_number: row.voucher_number,
          date: row.voucher_date,
          subtotal: row.subtotal,
          cgstTotal: row.cgstTotal,
          sgstTotal: row.sgstTotal,
          igstTotal: row.igstTotal,
          tdsTotal: row.tdsTotal,
          total: row.total,
          partyId: row.partyId,
          partyName: row.party_name,
          entries: [],
        };

        /* 🔴 PARTY -> CREDIT */
        vouchers[key].entries.push({
          id: `PUR-P-${row.voucher_id}`,
          ledger_id: row.partyId,
          ledger_name: row.party_name,
          amount: Number(row.total),
          entry_type: "credit",
          narration: "Purchase Party",
          isParty: true,
        });
      }

      /* ================================
         2. PURCHASE LEDGER -> DEBIT (REAL LEDGER)
      ================================= */
      if (row.purchaseLedgerId) {
        vouchers[key].entries.push({
          id: `PUR-L-${row.voucher_id}-${row.purchaseLedgerId}-${vouchers[key].entries.length}`,
          ledger_id: row.purchaseLedgerId,
          ledger_name: row.purchase_ledger_name,
          amount: Number(row.item_amount),
          entry_type: "debit",
          narration: row.purchase_ledger_name,
          isParty: false,
          isChild: true,
        });
      }
    });

    /* =====================================================
       2.1 PURCHASE VOUCHER TAXES & TDS (AFTER ITEMS)
    ===================================================== */
    Object.values(vouchers).forEach((v) => {
      if (v.id.startsWith("PUR-")) {
        const subtotal = Number(v.subtotal || 0);
        const vid = v.id.split("-")[1];

        if (subtotal > 0) {
          // IGST
          if (Number(v.igstTotal) > 0) {
            const igstRate = ((v.igstTotal / subtotal) * 100).toFixed(2);
            v.entries.push({
              id: `PUR-IGST-${vid}`,
              ledger_id: null,
              ledger_name: `IGST @ ${igstRate}%`,
              amount: Number(v.igstTotal),
              entry_type: "debit",
              narration: "IGST",
              isParty: false,
              isChild: true,
            });
          }

          // CGST
          if (Number(v.cgstTotal) > 0) {
            const cgstRate = ((v.cgstTotal / subtotal) * 100).toFixed(2);
            v.entries.push({
              id: `PUR-CGST-${vid}`,
              ledger_id: null,
              ledger_name: `CGST @ ${cgstRate}%`,
              amount: Number(v.cgstTotal),
              entry_type: "debit",
              narration: "CGST",
              isParty: false,
              isChild: true,
            });
          }

          // SGST
          if (Number(v.sgstTotal) > 0) {
            const sgstRate = ((v.sgstTotal / subtotal) * 100).toFixed(2);
            v.entries.push({
              id: `PUR-SGST-${vid}`,
              ledger_id: null,
              ledger_name: `SGST @ ${sgstRate}%`,
              amount: Number(v.sgstTotal),
              entry_type: "debit",
              narration: "SGST",
              isParty: false,
              isChild: true,
            });
          }

          // TDS (LAST)
          // Purchase: Party Cr, Expense Dr, TDS Cr
          if (Number(v.tdsTotal) !== 0) {
            const tdsRate = ((Math.abs(v.tdsTotal) / subtotal) * 100).toFixed(2);
            v.entries.push({
              id: `PUR-TDS-${vid}`,
              ledger_id: null,
              ledger_name: `TDS @ ${tdsRate}%`,
              amount: Math.abs(Number(v.tdsTotal)),
              entry_type: "credit",
              narration: "TDS",
              isParty: false,
              isChild: true,
            });
          }
        }
      }
    });

    /* =====================================================
       3️⃣ SALES VOUCHERS → CREDIT
    ===================================================== */


    const [salesRows] = await db.query(
      `
  SELECT
    sv.id AS voucher_id,

    sv.partyId,
    party.name AS party_name,

    sv.number AS voucher_number,
    sv.date AS voucher_date,

    sv.subtotal,
    sv.cgstTotal,
    sv.sgstTotal,
    sv.igstTotal,
    sv.total,

    si.salesLedgerId,
    l.name AS sales_ledger_name,

    si.amount AS item_amount

  FROM sales_vouchers sv

  LEFT JOIN sales_voucher_items si
    ON si.voucherId = sv.id

  LEFT JOIN ledgers l
    ON l.id = si.salesLedgerId

  LEFT JOIN ledgers party
    ON party.id = sv.partyId

  WHERE sv.company_id = ?
    AND sv.owner_type = ?
    AND sv.owner_id = ?
    AND sv.type = 'sales'
    AND sv.isQuotation = 0

  GROUP BY sv.id, si.id
  `,
      [company_id, owner_type, owner_id]
    );

    salesRows.forEach((row) => {
      const key = `SAL-${row.voucher_id}`;

      /* ================================
         1. CREATE VOUCHER
      ================================= */
      if (!vouchers[key]) {
        vouchers[key] = {
          id: key,
          voucher_type: "sales",
          voucher_number: row.voucher_number,
          date: row.voucher_date,
          subtotal: row.subtotal,
          cgstTotal: row.cgstTotal,
          sgstTotal: row.sgstTotal,
          igstTotal: row.igstTotal,
          total: row.total,
          partyId: row.partyId,
          partyName: row.party_name,
          entries: [],
        };

        /* 🔴 PARTY → DEBIT */
        vouchers[key].entries.push({
          id: `SAL-P-${row.voucher_id}`,
          ledger_id: row.partyId,
          ledger_name: row.party_name,
          amount: Number(row.total),
          entry_type: "debit",
          narration: "Sales Party",
          isParty: true,
        });
      }

      /* ================================
         2. SALES LEDGER → CREDIT (REAL LEDGER)
      ================================= */
      if (row.salesLedgerId) {
        vouchers[key].entries.push({
          id: `SAL-L-${row.voucher_id}-${row.salesLedgerId}-${vouchers[key].entries.length}`,
          ledger_id: row.salesLedgerId,
          ledger_name: row.sales_ledger_name,
          amount: Number(row.item_amount),
          entry_type: "credit",
          narration: row.sales_ledger_name,
          isParty: false,
          isChild: true,
        });
      }
    });

    /* =====================================================
       3.1 SALES TAXES (AFTER ITEMS)
    ===================================================== */
    Object.values(vouchers).forEach((v) => {
      if (v.id.startsWith("SAL-")) {
        const subtotal = Number(v.subtotal || 0);
        const vid = v.id.split("-")[1];

        if (subtotal > 0) {
          // IGST
          if (Number(v.igstTotal) > 0) {
            const igstRate = ((v.igstTotal / subtotal) * 100).toFixed(2);
            v.entries.push({
              id: `SAL-IGST-${vid}`,
              ledger_id: null,
              ledger_name: `IGST @ ${igstRate}%`,
              amount: Number(v.igstTotal),
              entry_type: "credit",
              narration: "IGST",
              isParty: false,
              isChild: true,
            });
          }

          // CGST
          if (Number(v.cgstTotal) > 0) {
            const cgstRate = ((v.cgstTotal / subtotal) * 100).toFixed(2);
            v.entries.push({
              id: `SAL-CGST-${vid}`,
              ledger_id: null,
              ledger_name: `CGST @ ${cgstRate}%`,
              amount: Number(v.cgstTotal),
              entry_type: "credit",
              narration: "CGST",
              isParty: false,
              isChild: true,
            });
          }

          // SGST
          if (Number(v.sgstTotal) > 0) {
            const sgstRate = ((v.sgstTotal / subtotal) * 100).toFixed(2);
            v.entries.push({
              id: `SAL-SGST-${vid}`,
              ledger_id: null,
              ledger_name: `SGST @ ${sgstRate}%`,
              amount: Number(v.sgstTotal),
              entry_type: "credit",
              narration: "SGST",
              isParty: false,
              isChild: true,
            });
          }
        }
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
