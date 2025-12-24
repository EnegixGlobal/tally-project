const express = require("express");
const router = express.Router();
const pool = require("../db"); // Your MySQL connection pool

function safeArrayParams(arr) {
  if (Array.isArray(arr) && arr.length > 0) return arr;
  return [0]; // fallback for SQL IN ()
}

// Helper to parse int safely
function toInt(v, def = 0) {
  const n = parseInt(v, 10);
  return isNaN(n) ? def : n;
}

// router.get("/api/outstanding-receivables", async (req, res) => {
//   try {
//     const {
//       searchTerm = "",
//       customerGroup = "",
//       riskCategory = "",
//       company_id,
//       owner_type,
//       owner_id,
//     } = req.query;

//     if (!company_id || !owner_type || !owner_id) {
//       return res.status(400).json({ error: "Missing tenant info" });
//     }

//     /* =========================
//        1️⃣ FETCH CUSTOMERS
//     ========================== */
//     let customerSql = `
//       SELECT
//         l.id,
//         l.name,
//         lg.name AS customerGroup,
//         l.address,
//         l.phone,
//         l.email,
//         l.gst_number
//       FROM ledgers l
//       LEFT JOIN ledger_groups lg ON lg.id = l.group_id
//       WHERE l.company_id = ?
//         AND l.owner_type = ?
//         AND l.owner_id = ?
//     `;

//     const params = [company_id, owner_type, owner_id];

//     if (searchTerm) {
//       customerSql += ` AND (
//         LOWER(l.name) LIKE ?
//         OR LOWER(l.gst_number) LIKE ?
//         OR LOWER(l.email) LIKE ?
//       )`;
//       const p = `%${searchTerm.toLowerCase()}%`;
//       params.push(p, p, p);
//     }

//     if (customerGroup) {
//       customerSql += ` AND lg.name = ?`;
//       params.push(customerGroup);
//     }

//     const [customers] = await pool.query(customerSql, params);
//     if (!customers.length) return res.json([]);

//     const customerIds = customers.map((c) => c.id);

//     /* =========================
//        2️⃣ FETCH SALES INVOICES
//     ========================== */
//     const invoiceSql = `
//       SELECT
//         ve.ledger_id AS customer_id,
//         vm.date,
//         vm.due_date,
//         SUM(CASE WHEN ve.entry_type = 'debit' THEN ve.amount ELSE 0 END) -
//         SUM(CASE WHEN ve.entry_type = 'credit' THEN ve.amount ELSE 0 END) AS amount
//       FROM voucher_main vm
//       JOIN voucher_entries ve ON ve.voucher_id = vm.id
//       WHERE vm.voucher_type LIKE '%sale%'
//         AND vm.company_id = ?
//         AND vm.owner_type = ?
//         AND vm.owner_id = ?
//         AND ve.ledger_id IN (${customerIds.map(() => "?").join(",")})
//       GROUP BY vm.id, ve.ledger_id
//     `;

//     const [invoices] = await pool.query(invoiceSql, [
//       company_id,
//       owner_type,
//       owner_id,
//       ...customerIds,
//     ]);

//     const today = new Date();

//     /* =========================
//        3️⃣ BUILD FINAL RESPONSE
//     ========================== */
//     const results = customers
//       .map((c) => {
//         const custInvoices = invoices.filter((i) => i.customer_id === c.id);

//         let totalOutstanding = 0;
//         let currentDue = 0;
//         let overdue = 0;

//         let ageing = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };

//         custInvoices.forEach((inv) => {
//           totalOutstanding += inv.amount;

//           if (!inv.due_date) {
//             currentDue += inv.amount;
//             return;
//           }

//           const days = Math.floor(
//             (today - new Date(inv.due_date)) / (1000 * 60 * 60 * 24)
//           );

//           if (days <= 0) currentDue += inv.amount;
//           else {
//             overdue += inv.amount;
//             if (days <= 30) ageing["0-30"] += inv.amount;
//             else if (days <= 60) ageing["31-60"] += inv.amount;
//             else if (days <= 90) ageing["61-90"] += inv.amount;
//             else ageing["90+"] += inv.amount;
//           }
//         });

//         let risk = "Low";
//         if (overdue > 500000) risk = "Critical";
//         else if (overdue > 200000) risk = "High";
//         else if (overdue > 50000) risk = "Medium";

//         if (riskCategory && riskCategory !== risk) return null;

//         return {
//           id: String(c.id),
//           customerName: c.name,
//           customerGroup: c.customerGroup || "",
//           customerAddress: c.address || "",
//           customerPhone: c.phone || "",
//           customerEmail: c.email || "",
//           customerGSTIN: c.gst_number || "",
//           totalOutstanding: Number(totalOutstanding.toFixed(2)),
//           currentDue: Number(currentDue.toFixed(2)),
//           overdue: Number(overdue.toFixed(2)),
//           creditLimit: 0,
//           creditDays: 0,
//           totalBills: custInvoices.length,
//           riskCategory: risk,
//           ageingBreakdown: ageing,
//         };
//       })
//       .filter(Boolean);

//     res.json(results);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

router.get("/api/outstanding-receivables", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, customerGroup } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: "Missing tenant info" });
    }

    /* =========================
       1️⃣ LEDGERS (FILTER BY GROUP)
    ========================== */
    let ledgerSql = `
      SELECT
        l.id    AS ledger_id,
        l.name  AS ledger_name,
        l.group_id,
        l.opening_balance,
        l.balance_type,
        lg.name AS ledger_group_name
      FROM ledgers l
      LEFT JOIN ledger_groups lg ON lg.id = l.group_id
      WHERE l.company_id = ?
        AND l.owner_type = ?
        AND l.owner_id = ?
    `;

    const params = [company_id, owner_type, owner_id, customerGroup];

    if (customerGroup) {
      ledgerSql += ` AND l.group_id = ?`;
      params.push(customerGroup);
    }

    const [ledgers] = await pool.query(ledgerSql, params);
    console.log('this is ledger', ledgers)

    if (!ledgers.length) return res.json([]);

    /* =========================
       2️⃣ SALES VOUCHERS
    ========================== */
    const ledgerIds = ledgers.map((l) => l.ledger_id);

 

    const salesSql = `
      SELECT
        id,
        date,
        total,
        salesLedgerId
      FROM sales_vouchers
      WHERE company_id = ?
        AND owner_type = ?
        AND owner_id = ?
        AND salesLedgerId IN (${ledgerIds.map(() => "?").join(",")})
    `;

    const [salesRows] = await pool.query(salesSql, [
      company_id,
      owner_type,
      owner_id,
      ...ledgerIds,
    ]);
  



    /* =========================
       3️⃣ PURCHASE VOUCHERS
    ========================== */
    const purchaseSql = `
      SELECT
        id,
        date,
        total,
        purchaseLedgerId
      FROM purchase_vouchers
      WHERE company_id = ?
        AND owner_type = ?
        AND owner_id = ?
        AND purchaseLedgerId IN (${ledgerIds.map(() => "?").join(",")})
    `;

    const [purchaseRows] = await pool.query(purchaseSql, [
      company_id,
      owner_type,
      owner_id,
      ...ledgerIds,
    ]);
    console.log('this is purchaseRows', purchaseRows)

    /* =========================
       4️⃣ MERGE DATA (FINAL)
    ========================== */
    const finalResult = ledgers.map((ledger) => {
      const sales = salesRows
        .filter((s) => s.salesLedgerId === ledger.ledger_id)
        .map((s) => ({
          source: "sales",
          voucher_id: s.id,
          date: s.date,
          total: s.total,
        }));

      const purchases = purchaseRows
        .filter((p) => p.purchaseLedgerId === ledger.ledger_id)
        .map((p) => ({
          source: "purchase",
          voucher_id: p.id,
          date: p.date,
          total: p.total,
        }));



      return {
        ...ledger,
        vouchers: [...sales, ...purchases],
      };
    });

    /* =========================
       5️⃣ RESPONSE
    ========================== */
    res.json(finalResult);
  } catch (err) {
    console.error("Outstanding receivables error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
