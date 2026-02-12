const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const { company_id, owner_type, owner_id } = req.query;

    if (!id || !company_id || !owner_type || !owner_id) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        let voucher = null;

        if (id.startsWith("ACC-")) {
            const voucherId = id.split("-")[1];
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
        WHERE vm.id = ? 
          AND vm.company_id = ?
        `,
                [voucherId, company_id]
            );

            if (rows.length > 0) {
                const row = rows[0];
                voucher = {
                    id: id,
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
                    total: 0 // Initialize total
                };

                rows.forEach((r) => {
                    if (r.entry_id) {
                        voucher.entries.push({
                            id: r.entry_id,
                            ledger_id: r.ledger_id,
                            ledger_name: r.ledger_name,
                            amount: r.amount,
                            entry_type: r.entry_type,
                            narration: r.entry_narration,
                            item_id: r.item_id,
                        });

                        // Sum debits for total
                        if (r.entry_type === 'debit') {
                            voucher.total += Number(r.amount || 0);
                        }
                    }
                });
            }

        } else if (id.startsWith("PUR-")) {
            const voucherId = id.split("-")[1];
            const [rows] = await db.query(
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
          pv.discountTotal,
          pv.total,
          pi.purchaseLedgerId,
          l.name AS purchase_ledger_name,
          pi.amount AS item_amount
         FROM purchase_vouchers pv
        LEFT JOIN purchase_voucher_items pi ON pi.voucherId = pv.id
        LEFT JOIN ledgers l ON l.id = pi.purchaseLedgerId
        LEFT JOIN ledgers party ON party.id = pv.partyId
        WHERE pv.id = ? AND pv.company_id = ?
        `,
                [voucherId, company_id]
            );

            if (rows.length > 0) {
                const row = rows[0];
                voucher = {
                    id: id,
                    voucher_type: "purchase",
                    voucher_number: row.voucher_number,
                    date: row.voucher_date,
                    subtotal: row.subtotal,
                    cgstTotal: row.cgstTotal,
                    sgstTotal: row.sgstTotal,
                    igstTotal: row.igstTotal,
                    tdsTotal: row.tdsTotal,
                    discountTotal: row.discountTotal,
                    total: row.total,
                    partyId: row.partyId,
                    partyName: row.party_name,
                    entries: [],
                };

                voucher.entries.push({
                    id: `PUR-P-${row.voucher_id}`,
                    ledger_id: row.partyId,
                    ledger_name: row.party_name,
                    amount: Number(row.total),
                    entry_type: "credit",
                    narration: "Purchase Party",
                    isParty: true,
                });

                rows.forEach((r) => {
                    if (r.purchaseLedgerId) {
                        voucher.entries.push({
                            id: `PUR-L-${r.voucher_id}-${r.purchaseLedgerId}-${voucher.entries.length}`,
                            ledger_id: r.purchaseLedgerId,
                            ledger_name: r.purchase_ledger_name,
                            amount: Number(r.item_amount),
                            entry_type: "debit",
                            narration: r.purchase_ledger_name,
                            isParty: false,
                            isChild: true,
                        });
                    }
                });

                // Add Taxes
                const subtotal = Number(voucher.subtotal || 0);
                if (subtotal > 0) {
                    if (Number(voucher.igstTotal) > 0) {
                        const rate = ((voucher.igstTotal / subtotal) * 100).toFixed(2);
                        voucher.entries.push({ id: `PUR-IGST-${voucherId}`, ledger_name: `IGST @ ${rate}%`, amount: Number(voucher.igstTotal), entry_type: 'debit', isChild: true });
                    }
                    if (Number(voucher.cgstTotal) > 0) {
                        const rate = ((voucher.cgstTotal / subtotal) * 100).toFixed(2);
                        voucher.entries.push({ id: `PUR-CGST-${voucherId}`, ledger_name: `CGST @ ${rate}%`, amount: Number(voucher.cgstTotal), entry_type: 'debit', isChild: true });
                    }
                    if (Number(voucher.sgstTotal) > 0) {
                        const rate = ((voucher.sgstTotal / subtotal) * 100).toFixed(2);
                        voucher.entries.push({ id: `PUR-SGST-${voucherId}`, ledger_name: `SGST @ ${rate}%`, amount: Number(voucher.sgstTotal), entry_type: 'debit', isChild: true });
                    }

                    // TDS Logic: Check if it was subtracted (Credit) or Added (Debit)
                    if (Number(voucher.tdsTotal) !== 0) {
                        const rate = ((Math.abs(voucher.tdsTotal) / subtotal) * 100).toFixed(2);

                        // Calculate expected total if TDS is Credit (Subtracted)
                        const totalIfCredit =
                            Number(voucher.subtotal || 0) +
                            Number(voucher.cgstTotal || 0) +
                            Number(voucher.sgstTotal || 0) +
                            Number(voucher.igstTotal || 0) -
                            Number(voucher.discountTotal || 0) -
                            Math.abs(Number(voucher.tdsTotal || 0));

                        // Compare with actual total
                        const isCredit = Math.abs(Number(voucher.total) - totalIfCredit) < 0.05;

                        voucher.entries.push({
                            id: `PUR-TDS-${voucherId}`,
                            ledger_name: `TDS @ ${rate}%`,
                            amount: Math.abs(Number(voucher.tdsTotal)),
                            entry_type: isCredit ? 'credit' : 'debit',
                            isChild: true
                        });
                    }
                }
            }

        } else if (id.startsWith("SAL-")) {
            const voucherId = id.split("-")[1];
            const [rows] = await db.query(
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
        LEFT JOIN sales_voucher_items si ON si.voucherId = sv.id
        LEFT JOIN ledgers l ON l.id = si.salesLedgerId
        LEFT JOIN ledgers party ON party.id = sv.partyId
        WHERE sv.id = ? AND sv.company_id = ?
        `,
                [voucherId, company_id]
            );

            if (rows.length > 0) {
                const row = rows[0];
                voucher = {
                    id: id,
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

                voucher.entries.push({
                    id: `SAL-P-${row.voucher_id}`,
                    ledger_id: row.partyId,
                    ledger_name: row.party_name,
                    amount: Number(row.total),
                    entry_type: "debit",
                    narration: "Sales Party",
                    isParty: true,
                });

                rows.forEach((r) => {
                    if (r.salesLedgerId) {
                        voucher.entries.push({
                            id: `SAL-L-${r.voucher_id}-${r.salesLedgerId}-${voucher.entries.length}`,
                            ledger_id: r.salesLedgerId,
                            ledger_name: r.sales_ledger_name,
                            amount: Number(r.item_amount),
                            entry_type: "credit",
                            narration: r.sales_ledger_name,
                            isParty: false,
                            isChild: true,
                        });
                    }
                });

                const subtotal = Number(voucher.subtotal || 0);
                if (subtotal > 0) {
                    if (Number(voucher.igstTotal) > 0) {
                        const rate = ((voucher.igstTotal / subtotal) * 100).toFixed(2);
                        voucher.entries.push({ id: `SAL-IGST-${voucherId}`, ledger_name: `IGST @ ${rate}%`, amount: Number(voucher.igstTotal), entry_type: 'credit', isChild: true });
                    }
                    if (Number(voucher.cgstTotal) > 0) {
                        const rate = ((voucher.cgstTotal / subtotal) * 100).toFixed(2);
                        voucher.entries.push({ id: `SAL-CGST-${voucherId}`, ledger_name: `CGST @ ${rate}%`, amount: Number(voucher.cgstTotal), entry_type: 'credit', isChild: true });
                    }
                    if (Number(voucher.sgstTotal) > 0) {
                        const rate = ((voucher.sgstTotal / subtotal) * 100).toFixed(2);
                        voucher.entries.push({ id: `SAL-SGST-${voucherId}`, ledger_name: `SGST @ ${rate}%`, amount: Number(voucher.sgstTotal), entry_type: 'credit', isChild: true });
                    }
                }
            }

        } else if (id.startsWith("DN-")) {
            // Logic for Debit Note
            const voucherId = id.split("-")[1];
            const [rows] = await db.query(
                `SELECT * FROM debit_note_vouchers WHERE id = ? AND company_id = ?`,
                [voucherId, company_id]
            );
            if (rows.length > 0) {
                const dn = rows[0];
                let entries = [];
                if (dn.narration) {
                    try {
                        const parsed = JSON.parse(dn.narration);
                        if (Array.isArray(parsed.accountingEntries)) {
                            const ledgerIds = parsed.accountingEntries.map((e) => e.ledgerId);
                            let ledgerMap = {};
                            if (ledgerIds.length) {
                                const [lRows] = await db.query(`SELECT id, name FROM ledgers WHERE id IN (?)`, [ledgerIds]);
                                lRows.forEach(l => ledgerMap[l.id] = l.name);
                            }
                            entries = parsed.accountingEntries.map((e, idx) => ({
                                id: `DN-E-${dn.id}-${idx}`,
                                ledger_id: e.ledgerId,
                                ledger_name: ledgerMap[e.ledgerId] || `Ledger ${e.ledgerId}`,
                                amount: e.amount,
                                entry_type: e.type,
                                narration: parsed.note || "",
                            }));
                        }
                    } catch (e) { }
                }
                voucher = {
                    id: id,
                    voucher_type: "Debit Note",
                    voucher_number: dn.number,
                    date: dn.date,
                    narration: "",
                    entries
                };
            }

        } else if (id.startsWith("CRN-") || id.startsWith("CN-")) { // Supporting both
            const voucherId = id.split("-")[1];
            const [rows] = await db.query(
                `SELECT * FROM credit_vouchers WHERE id = ? AND company_id = ?`,
                [voucherId, company_id]
            );
            if (rows.length > 0) {
                const cv = rows[0];
                let entries = [];
                if (cv.narration) {
                    try {
                        const parsed = JSON.parse(cv.narration);
                        if (Array.isArray(parsed.accountingEntries)) {
                            const ledgerIds = parsed.accountingEntries.map((e) => e.ledgerId);
                            let ledgerMap = {};
                            if (ledgerIds.length) {
                                const [lRows] = await db.query(`SELECT id, name FROM ledgers WHERE id IN (?)`, [ledgerIds]);
                                lRows.forEach(l => ledgerMap[l.id] = l.name);
                            }
                            entries = parsed.accountingEntries.map((e, idx) => ({
                                id: `CRN-E-${cv.id}-${idx}`,
                                ledger_id: e.ledgerId,
                                ledger_name: ledgerMap[e.ledgerId] || `Ledger ${e.ledgerId}`,
                                amount: e.amount,
                                entry_type: e.type,
                                narration: parsed.note || "",
                            }));
                        }
                    } catch (e) { }
                }
                voucher = {
                    id: id,
                    voucher_type: "Credit Note",
                    voucher_number: cv.number,
                    date: cv.date,
                    narration: "",
                    entries
                };
            }
        }

        if (!voucher) {
            return res.status(404).json({ error: "Voucher not found" });
        }

        res.json(voucher);

    } catch (error) {
        console.error("Error fetching voucher details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
