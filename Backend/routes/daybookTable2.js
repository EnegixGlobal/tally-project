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
        pv.id, pv.number, pv.date, pv.narration, pv.referenceNo,
        pv.supplierInvoiceDate, pv.purchaseLedgerId, pv.total,
        pv.company_id, pv.owner_type, pv.owner_id,
        l.name AS ledger_name
      FROM purchase_vouchers pv
      LEFT JOIN ledgers l ON l.id = pv.purchaseLedgerId
      WHERE pv.company_id = ?
        AND pv.owner_type = ?
        AND pv.owner_id = ?
      `,
      [company_id, owner_type, owner_id]
    );

    purchaseRows.forEach((pv) => {
      vouchers[`PUR-${pv.id}`] = {
        id: `PUR-${pv.id}`,
        voucher_type: "Purchase",
        voucher_number: pv.number,
        date: pv.date,
        narration: pv.narration,
        reference_no: pv.referenceNo,
        supplier_invoice_date: pv.supplierInvoiceDate,
        company_id: pv.company_id,
        owner_type: pv.owner_type,
        owner_id: pv.owner_id,
        entries: [
          {
            id: `PUR-E-${pv.id}`,
            ledger_id: pv.purchaseLedgerId,
            ledger_name: pv.ledger_name,
            amount: pv.total,
            entry_type: "debit",
            narration: pv.narration,
            item_id: null,
          },
        ],
      };
    });

    /* =====================================================
       3️⃣ SALES VOUCHERS → CREDIT
    ===================================================== */
    const [salesRows] = await db.query(
      `
      SELECT
        sv.id, sv.number, sv.date, sv.narration, sv.referenceNo,
        sv.supplierInvoiceDate, sv.salesLedgerId, sv.total,
        sv.company_id, sv.owner_type, sv.owner_id,
        l.name AS ledger_name
      FROM sales_vouchers sv
      LEFT JOIN ledgers l ON l.id = sv.salesLedgerId
      WHERE sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?
        AND sv.type = 'sales'
        AND sv.isQuotation = 0
      `,
      [company_id, owner_type, owner_id]
    );

    salesRows.forEach((sv) => {
      vouchers[`SAL-${sv.id}`] = {
        id: `SAL-${sv.id}`,
        voucher_type: "Sales",
        voucher_number: sv.number,
        date: sv.date,
        narration: sv.narration,
        reference_no: sv.referenceNo,
        supplier_invoice_date: sv.supplierInvoiceDate,
        company_id: sv.company_id,
        owner_type: sv.owner_type,
        owner_id: sv.owner_id,
        entries: [
          {
            id: `SAL-E-${sv.id}`,
            ledger_id: sv.salesLedgerId,
            ledger_name: sv.ledger_name,
            amount: sv.total,
            entry_type: "credit",
            narration: sv.narration,
            item_id: null,
          },
        ],
      };
    });

    /* =====================================================
   4️⃣ SALES ORDERS → CREDIT (WITH ITEMS TOTAL) ✅ FIXED
===================================================== */
    const [salesOrderRows] = await db.query(
      `
  SELECT
    so.id,
    so.number,
    so.date,
    so.narration,
    so.referenceNo,
    so.salesLedgerId,
    so.company_id,
    so.owner_type,
    so.owner_id,
    l.name AS ledger_name,

    SUM(soi.amount) AS totalAmount
  FROM sales_orders so
  LEFT JOIN sales_order_items soi 
    ON soi.salesOrderId = so.id
  LEFT JOIN ledgers l 
    ON l.id = so.salesLedgerId
  WHERE so.company_id = ?
    AND so.owner_type = ?
    AND so.owner_id = ?
  GROUP BY so.id
  `,
      [company_id, owner_type, owner_id]
    );

    salesOrderRows.forEach((so) => {
      vouchers[`SO-${so.id}`] = {
        id: `SO-${so.id}`,
        voucher_type: "Sales Order",
        voucher_number: so.number,
        date: so.date,
        narration: so.narration,
        reference_no: so.referenceNo,
        supplier_invoice_date: null,
        company_id: so.company_id,
        owner_type: so.owner_type,
        owner_id: so.owner_id,
        entries: [
          {
            id: `SO-E-${so.id}`,
            ledger_id: so.salesLedgerId,
            ledger_name: so.ledger_name,
            amount: Number(so.totalAmount || 0),
            entry_type: "credit",
            narration: so.narration,
            item_id: null,
          },
        ],
      };
    });

    /* =====================================================
   5️⃣ PURCHASE ORDERS → DEBIT (WITH ITEMS TOTAL) ✅
===================================================== */
    const [purchaseOrderRows] = await db.query(
      `
  SELECT
    po.id,
    po.number,
    po.date,
    po.narration,
    po.reference_no,
    po.party_id,
    po.purchase_ledger_id,
    po.company_id,
    po.owner_type,
    po.owner_id,
    l.name AS ledger_name,

    SUM(poi.amount) AS totalAmount
  FROM purchase_orders po
  LEFT JOIN purchase_order_items poi
    ON poi.purchase_order_id = po.id
  LEFT JOIN ledgers l
    ON l.id = po.purchase_ledger_id
  WHERE po.company_id = ?
    AND po.owner_type = ?
    AND po.owner_id = ?
  GROUP BY po.id
  `,
      [company_id, owner_type, owner_id]
    );

    purchaseOrderRows.forEach((po) => {
      vouchers[`PO-${po.id}`] = {
        id: `PO-${po.id}`,
        voucher_type: "Purchase Order",
        voucher_number: po.number,
        date: po.date,
        narration: po.narration,
        reference_no: po.reference_no,
        supplier_invoice_date: null,
        company_id: po.company_id,
        owner_type: po.owner_type,
        owner_id: po.owner_id,
        entries: [
          {
            id: `PO-E-${po.id}`,
            ledger_id: po.purchase_ledger_id,
            ledger_name: po.ledger_name,
            amount: Number(po.totalAmount || 0),
            entry_type: "debit",
            narration: po.narration,
            item_id: null,
          },
        ],
      };
    });

    /* =====================================================
   4️⃣A QUOTATIONS → CREDIT (sales_vouchers, isQuotation = 1)
===================================================== */
    const [quotationRows] = await db.query(
      `
  SELECT
    sv.id,
    sv.number,
    sv.date,
    sv.narration,
    sv.referenceNo,
    sv.salesLedgerId,
    sv.total,
    sv.company_id,
    sv.owner_type,
    sv.owner_id,
    l.name AS ledger_name
  FROM sales_vouchers sv
  LEFT JOIN ledgers l ON l.id = sv.salesLedgerId
  WHERE sv.company_id = ?
    AND sv.owner_type = ?
    AND sv.owner_id = ?
    AND sv.isQuotation = 1
  `,
      [company_id, owner_type, owner_id]
    );

    quotationRows.forEach((qt) => {
      vouchers[`QT-${qt.id}`] = {
        id: `QT-${qt.id}`,
        voucher_type: "Quotation",
        voucher_number: qt.number,
        date: qt.date,
        narration: qt.narration,
        reference_no: qt.referenceNo,
        supplier_invoice_date: null,
        company_id: qt.company_id,
        owner_type: qt.owner_type,
        owner_id: qt.owner_id,
        entries: [
          {
            id: `QT-E-${qt.id}`,
            ledger_id: qt.salesLedgerId,
            ledger_name: qt.ledger_name,
            amount: Number(qt.total || 0),
            entry_type: "credit",
            narration: qt.narration,
            item_id: null,
          },
        ],
      };
    });

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
