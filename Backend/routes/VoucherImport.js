const express = require("express");
const router = express.Router();
const db = require("../db");

const { getFinancialYear } = require("../utils/financialYear");
const { generateVoucherNumber } = require("../utils/generateVoucherNumber");

// =========================================
// PURCHASE EXCEL IMPORT (JSON DATA)
// =========================================

router.post("/purchase_import", async (req, res) => {
    try {
        const { rows, companyId, ownerType, ownerId } = req.body;
        console.log("rows", rows, companyId, ownerType, ownerId);

        // ================= VALIDATION =================

        if (!rows || !rows.length) {
            return res.status(400).json({
                success: false,
                message: "No data received",
            });
        }

        if (!companyId || !ownerType || !ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // ================= LOAD MASTER DATA =================

        const [ledgers] = await db.execute(
            "SELECT id, name FROM ledgers WHERE company_id=?",
            [companyId]
        );

        const [items] = await db.execute(
            "SELECT id, name FROM stock_items WHERE company_id=?",
            [companyId]
        );

        const ledgerMap = {};
        const itemMap = {};

        ledgers.forEach((l) => {
            ledgerMap[l.name.toLowerCase().trim()] = l.id;
        });

        items.forEach((i) => {
            itemMap[i.name.toLowerCase().trim()] = i.id;
        });

        // ================= GROUP BY DATE + SUPPLIER =================

        const groups = {};

        rows.forEach((row, i) => {
            const supplierName = row["Supplier Name"] ? String(row["Supplier Name"]).toLowerCase().trim() : "";
            const date = row.Date || "";

            if (!supplierName || !date) {
                errors.push(`Row ${i + 2}: Missing Date or Supplier Name`);
                return;
            }

            const key = date + "|" + supplierName;

            if (!groups[key]) {
                groups[key] = {
                    header: row,
                    items: [],
                    rowNos: [],
                };
            }

            groups[key].items.push(row);
            groups[key].rowNos.push(i + 2);
        });

        const errors = [];
        const saved = [];

        // ================= PROCESS EACH GROUP =================

        for (const key in groups) {
            const group = groups[key];
            const header = group.header;

            // ---------- SUPPLIER ----------

            const supplierName = header["Supplier Name"]
                .toLowerCase()
                .trim();

            const partyId = ledgerMap[supplierName];

            if (!partyId) {
                errors.push(`Supplier not found: ${header["Supplier Name"]}`);
                continue;
            }

            // ---------- PURCHASE LEDGER ----------

            const purchaseLedgerId =
                ledgerMap[header["Purchase Ledger"]?.toLowerCase().trim()];

            if (!purchaseLedgerId) {
                errors.push(`Purchase Ledger not found: ${header["Purchase Ledger"]}`);
                continue;
            }

            let subtotal = 0;
            let cgstTotal = 0;
            let sgstTotal = 0;
            let igstTotal = 0;

            const entries = [];

            // ---------- ITEMS LOOP ----------

            for (const row of group.items) {
                // Item

                const itemName = row["Item Name"]
                    .toLowerCase()
                    .trim();

                const itemId = itemMap[itemName];

                if (!itemId) {
                    errors.push(`Item not found: ${row["Item Name"]}`);
                    continue;
                }

                const qty = Number(row.Quantity || 0);
                const rate = Number(row.Rate || 0);
                const amount = Number(row.Amount || qty * rate);

                if (!qty || !rate) {
                    errors.push(`Invalid qty/rate: ${row["Item Name"]}`);
                    continue;
                }

                // ---------- GST ----------

                const cgst = +row["CGST Rate"] || 0;
                const sgst = +row["SGST Rate"] || 0;
                const igst = +row["IGST Rate"] || 0;

                // Rule: Either IGST or CGST+SGST

                if (igst && (cgst || sgst)) {
                    errors.push(`GST Error (Both) at ${row["Item Name"]}`);
                    continue;
                }

                if (!igst && (!cgst || !sgst)) {
                    errors.push(`GST Missing at ${row["Item Name"]}`);
                    continue;
                }

                subtotal += amount;

                if (igst) {
                    igstTotal += (amount * igst) / 100;
                } else {
                    cgstTotal += (amount * cgst) / 100;
                    sgstTotal += (amount * sgst) / 100;
                }

                // ---------- LEDGERS ----------

                const cgstLedgerId =
                    ledgerMap[row["CGST Ledger"]?.toLowerCase().trim()] || 0;

                const sgstLedgerId =
                    ledgerMap[row["SGST Ledger"]?.toLowerCase().trim()] || 0;

                const gstLedgerId =
                    ledgerMap[row["IGST Ledger"]?.toLowerCase().trim()] || 0;

                entries.push({
                    itemId,
                    quantity: qty,
                    rate,
                    amount,

                    cgstLedgerId,
                    sgstLedgerId,
                    gstLedgerId,

                    purchaseLedgerId,
                    batchNumber: row["Batch No"] ? String(row["Batch No"]).trim() : "",
                });
            }

            if (!entries.length) continue;

            // ---------- TOTAL ----------

            const total =
                subtotal + cgstTotal + sgstTotal + igstTotal;

            // ---------- GENERATE VOUCHER ----------

            const voucherNumber = await generateVoucherNumber({
                companyId,
                ownerType,
                ownerId,
                voucherType: "purchase",
                date: header.Date,
            });

            // ---------- SAVE HEADER ----------

            const [voucherResult] = await db.execute(
                `
        INSERT INTO purchase_vouchers (
          number, date, supplierInvoiceDate, narration, partyId, referenceNo,
          dispatchDocNo, dispatchThrough, destination, purchaseLedgerId,
          subtotal, cgstTotal, sgstTotal, igstTotal, discountTotal, tdsTotal, total,
          company_id, owner_type, owner_id
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
                [
                    voucherNumber,
                    header.Date,
                    header.Date, // supplierInvoiceDate
                    header.Narration || "",
                    partyId,
                    header["Reference No"] || "", // referenceNo

                    null, // dispatchDocNo
                    null, // dispatchThrough
                    null, // destination

                    purchaseLedgerId,

                    subtotal,
                    cgstTotal,
                    sgstTotal,
                    igstTotal,
                    0, // discountTotal
                    0, // tdsTotal
                    total,

                    companyId,
                    ownerType,
                    ownerId,
                ]
            );

            const voucherId = voucherResult.insertId;

            // ---------- SAVE ITEMS ----------

            const itemValues = entries.map((e) => [
                voucherId,
                e.itemId,
                e.quantity,
                e.rate,
                0, // discount

                e.cgstLedgerId,
                e.sgstLedgerId,
                e.gstLedgerId,

                e.amount,
                0, // tdsRate
                null, // godownId

                e.purchaseLedgerId,
            ]);

            await db.query(
                `
        INSERT INTO purchase_voucher_items
        (voucherId,itemId,quantity,rate,discount,
         cgstRate,sgstRate,igstRate,
         amount,tdsRate,godownId,purchaseLedgerId)
        VALUES ?
      `,
                [itemValues]
            );

            // ---------- SAVE HISTORY (Batches) ----------
            const historyValues = [];
            for (const row of group.items) {
                const batchNo = row["Batch No"] ? String(row["Batch No"]).trim() : "";
                if (batchNo) {
                    historyValues.push([
                        row["Item Name"] || "",
                        row["HSN Code"] || "",
                        batchNo,
                        Number(row.Quantity || 0),
                        header.Date, // purchaseDate
                        companyId,
                        ownerType,
                        ownerId,
                        "purchase",
                        Number(row.Rate || 0),
                        voucherNumber,
                        null // godownId
                    ]);
                }
            }

            if (historyValues.length > 0) {
                await db.query(
                    `INSERT INTO purchase_history 
                      (itemName, hsnCode, batchNumber, purchaseQuantity, purchaseDate, companyId, ownerType, ownerId, type, rate, voucherNumber, godownId)
                      VALUES ?`,
                    [historyValues]
                );
            }

            saved.push(voucherNumber);
        }

        // ================= RESPONSE =================

        return res.json({
            success: errors.length === 0,
            imported: saved.length,
            vouchers: saved,
            errors,
        });
    } catch (error) {
        console.error("Purchase Import Error:", error);

        return res.status(500).json({
            success: false,
            message: "Import failed",
            error: error.message,
        });
    }
});



// =========================================
// SALES EXCEL IMPORT (JSON DATA)
// =========================================

router.post("/sales_import", async (req, res) => {
    try {
        const { rows, companyId, ownerType, ownerId } = req.body;
        console.log("rows", rows, companyId, ownerType, ownerId);

        // ================= VALIDATION =================

        if (!rows || !rows.length) {
            return res.status(400).json({
                success: false,
                message: "No data received",
            });
        }

        if (!companyId || !ownerType || !ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // ================= LOAD MASTER DATA =================

        const [ledgers] = await db.execute(
            "SELECT id, name FROM ledgers WHERE company_id=?",
            [companyId]
        );

        const [items] = await db.execute(
            "SELECT id, name FROM stock_items WHERE company_id=?",
            [companyId]
        );

        const ledgerMap = {};
        const itemMap = {};

        ledgers.forEach((l) => {
            ledgerMap[l.name.toLowerCase().trim()] = l.id;
        });

        items.forEach((i) => {
            itemMap[i.name.toLowerCase().trim()] = i.id;
        });

        // ================= GROUP BY DATE + CUSTOMER =================

        const groups = {};

        const errors = [];
        const saved = [];

        rows.forEach((row, i) => {
            const customerName = row["Party Name"] ? String(row["Party Name"]).toLowerCase().trim() : "";
            const date = row.Date || "";

            if (!customerName || !date) {
                errors.push(`Row ${i + 2}: Missing Date or Party Name`);
                return;
            }

            const key = date + "|" + customerName;

            if (!groups[key]) {
                groups[key] = {
                    header: row,
                    items: [],
                    rowNos: [],
                };
            }

            groups[key].items.push(row);
            groups[key].rowNos.push(i + 2);
        });

        // ================= PROCESS EACH GROUP =================

        for (const key in groups) {
            const group = groups[key];
            const header = group.header;

            // ---------- PARTY ----------

            const customerName = header["Party Name"]
                .toLowerCase()
                .trim();

            const partyId = ledgerMap[customerName];

            if (!partyId) {
                errors.push(`Party not found: ${header["Party Name"]}`);
                continue;
            }

            // ---------- SALES LEDGER ----------

            const salesLedgerId =
                ledgerMap[header["Sales Ledger"]?.toLowerCase().trim()];

            if (!salesLedgerId) {
                errors.push(`Sales Ledger not found: ${header["Sales Ledger"]}`);
                continue;
            }

            let subtotal = 0;
            let cgstTotal = 0;
            let sgstTotal = 0;
            let igstTotal = 0;
            let discountTotal = 0;

            const entries = [];

            // ---------- ITEMS LOOP ----------

            for (const row of group.items) {
                // Item

                const itemName = row["Item Name"]
                    .toLowerCase()
                    .trim();

                const itemId = itemMap[itemName];

                if (!itemId) {
                    errors.push(`Item not found: ${row["Item Name"]}`);
                    continue;
                }

                const qty = Number(row.Quantity || 0);
                const rate = Number(row.Rate || 0);
                const amount = Number(row.Amount || qty * rate);

                if (!qty || !rate) {
                    errors.push(`Invalid qty/rate: ${row["Item Name"]}`);
                    continue;
                }

                // ---------- GST ----------

                const cgst = +row["CGST Rate"] || 0;
                const sgst = +row["SGST Rate"] || 0;
                const igst = +row["IGST Rate"] || 0;

                // Rule: Either IGST or CGST+SGST

                if (igst && (cgst || sgst)) {
                    errors.push(`GST Error (Both) at ${row["Item Name"]}`);
                    continue;
                }

                if (!igst && (!cgst || !sgst)) {
                    errors.push(`GST Missing at ${row["Item Name"]}`);
                    continue;
                }

                subtotal += amount;

                if (igst) {
                    igstTotal += (amount * igst) / 100;
                } else {
                    cgstTotal += (amount * cgst) / 100;
                    sgstTotal += (amount * sgst) / 100;
                }

                // ---------- LEDGERS ----------

                const cgstLedgerId =
                    ledgerMap[row["CGST Ledger"]?.toLowerCase().trim()] || 0;

                const sgstLedgerId =
                    ledgerMap[row["SGST Ledger"]?.toLowerCase().trim()] || 0;

                const gstLedgerId =
                    ledgerMap[row["IGST Ledger"]?.toLowerCase().trim()] || 0;


                entries.push({
                    itemId,
                    quantity: qty,
                    rate,
                    amount,

                    cgstLedgerId,
                    sgstLedgerId,
                    gstLedgerId,

                    salesLedgerId,
                    cgstRate: cgst,
                    sgstRate: sgst,
                    igstRate: igst,
                    batchNumber: row["Batch No"] ? String(row["Batch No"]).trim() : "",
                });
            }

            if (!entries.length) continue;

            // ---------- TOTAL ----------

            const total =
                subtotal + cgstTotal + sgstTotal + igstTotal - discountTotal;

            // ---------- GENERATE VOUCHER ----------

            const voucherNumber = await generateVoucherNumber({
                companyId,
                ownerType,
                ownerId,
                voucherType: "sales",
                date: header.Date,
            });

            // ---------- SAVE HEADER ----------

            const [voucherResult] = await db.execute(
                `
        INSERT INTO sales_vouchers (
          number, date, narration, partyId, referenceNo,
          dispatchDocNo, dispatchThrough, destination, approxDistance,
          subtotal, cgstTotal, sgstTotal, igstTotal, discountTotal, total,
          type, isQuotation, salesLedgerId, supplierInvoiceDate,
          company_id, owner_type, owner_id, sales_type_id, bill_no
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
                [
                    voucherNumber,
                    header.Date,
                    header.Narration || "",
                    partyId,
                    header["Reference No"] || "", // referenceNo

                    null, // dispatchDocNo
                    null, // dispatchThrough
                    null, // destination
                    null, // approxDistance

                    subtotal,
                    cgstTotal,
                    sgstTotal,
                    igstTotal,
                    discountTotal,
                    total,
                    "sales",
                    0, // isQuotation
                    salesLedgerId,
                    header.Date, // supplierInvoiceDate

                    companyId,
                    ownerType,
                    ownerId,
                    null, // sales_type_id
                    null, // bill_no
                ]
            );

            const voucherId = voucherResult.insertId;

            // ---------- SAVE ITEMS ----------

            const itemValues = entries.map((e) => [
                voucherId,
                e.itemId,
                e.quantity,
                e.rate,
                e.amount,
                e.cgstRate,
                e.sgstRate,
                e.igstRate,
                0, // discount
                "", // hsnCode
                e.batchNumber || "", // batchNumber
                null, // godownId
                e.salesLedgerId
            ]);

            await db.query(
                `
        INSERT INTO sales_voucher_items
        (voucherId,itemId,quantity,rate,amount,
         cgstRate,sgstRate,igstRate,
         discount,hsnCode,batchNumber,godownId,salesLedgerId)
        VALUES ?
      `,
                [itemValues]
            );

            // ---------- SAVE HISTORY (Batches) ----------
            const historyValues = [];
            for (const row of group.items) {
                const batchNo = row["Batch No"] ? String(row["Batch No"]).trim() : "";
                if (batchNo) {
                    historyValues.push([
                        row["Item Name"] || "",
                        row["HSN Code"] || "",
                        batchNo,
                        Number(row.Quantity || 0), // qtyChange
                        Number(row.Rate || 0),
                        header.Date, // movementDate
                        null, // godownId
                        voucherNumber,
                        companyId,
                        ownerType,
                        ownerId
                    ]);
                }
            }

            if (historyValues.length > 0) {
                await db.query(
                    `INSERT INTO sale_history 
                      (itemName, hsnCode, batchNumber, qtyChange, rate, movementDate, godownId, voucherNumber, companyId, ownerType, ownerId)
                      VALUES ?`,
                    [historyValues]
                );
            }

            saved.push(voucherNumber);
        }

        // ================= RESPONSE =================

        return res.json({
            success: errors.length === 0,
            imported: saved.length,
            vouchers: saved,
            errors,
        });
    } catch (error) {
        console.error("Sales Import Error:", error);

        return res.status(500).json({
            success: false,
            message: "Import failed",
            error: error.message,
        });
    }
});
module.exports = router;