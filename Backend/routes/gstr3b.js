const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;
    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }

    /* ---------------------------------------------------
       STEP 1: GET Nil / Exempted / Zero Rated LEDGERS
    --------------------------------------------------- */
    const [ledgerRows] = await db.query(
      `
      SELECT id, LOWER(TRIM(name)) AS name
      FROM ledgers
      WHERE company_id = ?
        AND owner_type = ?
        AND owner_id = ?
        AND LOWER(TRIM(name)) IN ('nil rated', 'exempted', 'zero rated')
      `,
      [company_id, owner_type, owner_id]
    );

    const ledgerIds = {
      nil: [],
      exempted: [],
      zero: [],
      all: [],
    };

    ledgerRows.forEach((l) => {
      ledgerIds.all.push(l.id);
      if (l.name === "nil rated") ledgerIds.nil.push(l.id);
      if (l.name === "exempted") ledgerIds.exempted.push(l.id);
      if (l.name === "zero rated") ledgerIds.zero.push(l.id);
    });

    /* ---------------------------------------------------
       A SECTION: TAXABLE (EXCEPT NIL / EXEMPTED / ZERO)
    --------------------------------------------------- */
    const [aItems] = await db.query(
      `
      SELECT
        svi.quantity,
        svi.rate,
        svi.cgstRate,
        svi.sgstRate,
        svi.igstRate
      FROM sales_voucher_items svi
      JOIN sales_vouchers sv ON sv.id = svi.voucherId
      WHERE sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?
        AND sv.type = 'sales'
        ${ledgerIds.all.length ? "AND sv.salesLedgerId NOT IN (?)" : ""}
      `,
      ledgerIds.all.length
        ? [company_id, owner_type, owner_id, ledgerIds.all]
        : [company_id, owner_type, owner_id]
    );

    const a = aItems.reduce(
      (acc, i) => {
        acc.taxable_value += Number(i.quantity) * Number(i.rate);
        acc.integrated_tax += Number(i.igstRate);
        acc.central_tax += Number(i.cgstRate);
        acc.state_tax += Number(i.sgstRate);
        return acc;
      },
      {
        taxable_value: 0,
        integrated_tax: 0,
        central_tax: 0,
        state_tax: 0,
      }
    );

    /* ---------------------------------------------------
         B SECTION: ZERO RATED -> match ledgerIds.zero to partyId
      --------------------------------------------------- */
    let b = { total: 0, byVoucher: [] };
    if (ledgerIds.zero.length) {
      const [zeroVouchers] = await db.query(
        `
          SELECT id
          FROM sales_vouchers
          WHERE company_id = ?
            AND owner_type = ?
            AND owner_id = ?
            AND type = 'sales'
            AND partyId IN (?)
          `,
        [company_id, owner_type, owner_id, ledgerIds.zero]
      );

      const voucherIds = zeroVouchers.map((v) => v.id);
      if (voucherIds.length) {
        const [bItems] = await db.query(
          `
            SELECT voucherId, quantity, rate
            FROM sales_voucher_items
            WHERE voucherId IN (?)
            `,
          [voucherIds]
        );

        const byVoucherMap = {};
        bItems.forEach((item) => {
          const val = Number(item.quantity) * Number(item.rate);
          b.total += val;
          byVoucherMap[item.voucherId] =
            (byVoucherMap[item.voucherId] || 0) + val;
        });

        b.byVoucher = Object.keys(byVoucherMap).map((vId) => ({
          voucherId: Number(vId),
          value: byVoucherMap[vId],
        }));
      }
    }

    /* ---------------------------------------------------
         C SECTION: NIL & EXEMPTED -> match ledgerIds.nil/exempted to partyId
      --------------------------------------------------- */
    const computeCFor = async (ledgerIdArray) => {
      const result = { total: 0, byVoucher: [] };
      if (!ledgerIdArray || !ledgerIdArray.length) return result;

      const [vouchers] = await db.query(
        `
          SELECT id
          FROM sales_vouchers
          WHERE company_id = ?
            AND owner_type = ?
            AND owner_id = ?
            AND type = 'sales'
            AND partyId IN (?)
          `,
        [company_id, owner_type, owner_id, ledgerIdArray]
      );

      const voucherIds = vouchers.map((v) => v.id);
      if (!voucherIds.length) return result;

      const [items] = await db.query(
        `
          SELECT voucherId, quantity, rate
          FROM sales_voucher_items
          WHERE voucherId IN (?)
          `,
        [voucherIds]
      );

      const byVoucherMap = {};
      items.forEach((it) => {
        const val = Number(it.quantity) * Number(it.rate);
        result.total += val;
        byVoucherMap[it.voucherId] = (byVoucherMap[it.voucherId] || 0) + val;
      });

      result.byVoucher = Object.keys(byVoucherMap).map((vId) => ({
        voucherId: Number(vId),
        value: byVoucherMap[vId],
      }));

      return result;
    };

    const c = {
      nil: await computeCFor(ledgerIds.nil),
      exempted: await computeCFor(ledgerIds.exempted),
    };

    // d data
    const [dRows] = await db.query(
      `
  SELECT
    pv.subtotal,
    pv.cgstTotal,
    pv.sgstTotal,
    pv.igstTotal
  FROM purchase_vouchers pv
  JOIN ledgers l ON l.id = pv.partyId
  WHERE pv.company_id = ?
    AND pv.owner_type = ?
    AND pv.owner_id = ?
    AND (
      l.gst_number IS NULL
      OR TRIM(l.gst_number) = ''
    )
  `,
      [company_id, owner_type, owner_id]
    );

    const d = dRows.reduce(
      (acc, r) => {
        acc.taxable_value += Number(r.subtotal) || 0;
        acc.central_tax += Number(r.cgstTotal) || 0;
        acc.state_tax += Number(r.sgstTotal) || 0;
        acc.integrated_tax += Number(r.igstTotal) || 0;
        return acc;
      },
      {
        taxable_value: 0,
        central_tax: 0,
        state_tax: 0,
        integrated_tax: 0,
      }
    );

    res.json({
      success: true,
      a,
      b,
      c,
      d,
    });
  } catch (error) {
    console.error("GSTR calculation error:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

router.get("/purchase", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, owner_type and owner_id are required",
      });
    }

    //get all value
    const [rows] = await db.query(
      `SELECT SUM(subtotal) AS totalSubtotal
     FROM purchase_vouchers
     WHERE company_id = ?
     AND owner_type = ?
     AND owner_id = ?`,
      [company_id, owner_type, owner_id]
    );

    const totalSubtotal = rows[0]?.totalSubtotal || 0;

    // c data
    const [dRows] = await db.query(
      `
  SELECT
    pv.subtotal,
    pv.cgstTotal,
    pv.sgstTotal,
    pv.igstTotal
  FROM purchase_vouchers pv
  JOIN ledgers l ON l.id = pv.partyId
  WHERE pv.company_id = ?
    AND pv.owner_type = ?
    AND pv.owner_id = ?
    AND (
      l.gst_number IS NULL
      OR TRIM(l.gst_number) = ''
    )
  `,
      [company_id, owner_type, owner_id]
    );

    const c = dRows.reduce(
      (acc, r) => {
        acc.taxable_value += Number(r.subtotal) || 0;
        acc.central_tax += Number(r.cgstTotal) || 0;
        acc.state_tax += Number(r.sgstTotal) || 0;
        acc.integrated_tax += Number(r.igstTotal) || 0;
        return acc;
      },
      {
        taxable_value: 0,
        central_tax: 0,
        state_tax: 0,
        integrated_tax: 0,
      }
    );

    res.json({
      success: true,
      // a,
      // b
      c,
      // d,
      e: totalSubtotal,
    });
  } catch (error) {
    console.error("GSTR calculation error:", error);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

module.exports = router;
