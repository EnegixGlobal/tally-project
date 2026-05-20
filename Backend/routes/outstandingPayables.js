const express = require("express");
const router = express.Router();
const pool = require("../db"); // your mysql2 pool

// Utility to safely handle empty array for SQL IN
function safeArray(arr) {
  return Array.isArray(arr) && arr.length > 0 ? arr : [-1];
}

// Helper to safely parse int query params
function toInt(val, def = 0) {
  const n = parseInt(val, 10);
  return isNaN(n) ? def : n;
}

// Main route for Outstanding Payables
// router.get('/api/outstanding-payables', async (req, res) => {
//   try {
//     const {
//       searchTerm = '',
//       supplierGroup = '',
//       riskCategory = '',
//       sortBy = 'amount',
//       sortOrder = 'desc',
//       limit = '100',
//       offset = '0',
//       company_id,
//       owner_type,
//       owner_id
//     } = req.query;

//     // Validate tenant params
//     if (!company_id || !owner_type || !owner_id) {
//       return res.status(400).json({ error: 'Missing required tenant parameters: company_id, owner_type, owner_id' });
//     }

//     const searchPattern = `%${searchTerm.toLowerCase()}%`;

//     // Build supplier group filter conditionally
//     const supplierGroupCondition = supplierGroup ? 'AND lg.name = ?' : '';
//     const supplierGroupParams = supplierGroup ? [supplierGroup] : [];

//     // Query suppliers scoped by tenant and filters
//     const suppliersSql = `
//       SELECT l.id, l.name, lg.name AS group_name, l.address, l.phone, l.email, l.gst_number AS gstin
//       FROM ledgers l
//       LEFT JOIN ledger_groups lg ON lg.id = l.group_id
//       WHERE LOWER(l.name) LIKE ?
//         AND l.company_id = ? AND l.owner_type = ? AND l.owner_id = ?
//         ${supplierGroupCondition}
//       LIMIT ? OFFSET ?
//     `;

//     const suppliersParams = [searchPattern, company_id, owner_type, owner_id, ...supplierGroupParams, toInt(limit), toInt(offset)];

//     const [suppliers] = await pool.query(suppliersSql, suppliersParams);

//     if (suppliers.length === 0) return res.json([]);

//     const supplierIds = suppliers.map(s => s.id);
//     const safeIds = safeArray(supplierIds);

//     // Query purchase invoices for these suppliers scoped by tenant
//     const purchaseSql = `
//       SELECT vm.id AS voucher_id, vm.voucher_type, vm.voucher_number, vm.date,
//              ve.ledger_id AS supplier_id,
//              SUM(CASE WHEN ve.entry_type = 'credit' THEN ve.amount ELSE 0 END) AS credit_amount,
//              SUM(CASE WHEN ve.entry_type = 'debit' THEN ve.amount ELSE 0 END) AS debit_amount,
//              MAX(vm.due_date) AS due_date
//       FROM voucher_main vm
//       JOIN voucher_entries ve ON ve.voucher_id = vm.id
//       WHERE vm.voucher_type LIKE '%purchase%'
//         AND ve.ledger_id IN (?)
//         AND vm.company_id = ? AND vm.owner_type = ? AND vm.owner_id = ?
//       GROUP BY vm.id, ve.ledger_id
//     `;

//     const [purchases] = await pool.query(purchaseSql, [safeIds, company_id, owner_type, owner_id]);

//     // Query payments (receipt/payment vouchers) for suppliers scoped by tenant
//     const paymentSql = `
//       SELECT ve.ledger_id AS supplier_id,
//              SUM(CASE WHEN ve.entry_type = 'debit' THEN ve.amount ELSE 0 END) AS total_paid,
//              MAX(vm.date) AS last_payment_date
//       FROM voucher_main vm
//       JOIN voucher_entries ve ON ve.voucher_id = vm.id
//       WHERE vm.voucher_type IN ('receipt', 'payment')
//         AND ve.ledger_id IN (?)
//         AND vm.company_id = ? AND vm.owner_type = ? AND vm.owner_id = ?
//       GROUP BY ve.ledger_id
//     `;

//     const [payments] = await pool.query(paymentSql, [safeIds, company_id, owner_type, owner_id]);

//     // Build payment lookup map
//     const paymentsMap = new Map();
//     payments.forEach(p => {
//       paymentsMap.set(p.supplier_id, {
//         total_paid: p.total_paid,
//         last_payment_date: p.last_payment_date
//       });
//     });

//     const today = new Date();

//     // Compose final data
//     let result = suppliers.map(supplier => {
//       const supplierPurchases = purchases.filter(p => p.supplier_id === supplier.id);

//       let totalPurchaseAmt = 0, overdueAmt = 0, currentAmt = 0;
//       // Simple bucket, can extend with more granularity
//       for (const purchase of supplierPurchases) {
//         const amt = (purchase.credit_amount || 0) - (purchase.debit_amount || 0);
//         totalPurchaseAmt += amt;
//         if (purchase.due_date) {
//           const dueDate = new Date(purchase.due_date);
//           const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
//           if (daysOverdue > 0) overdueAmt += amt;
//           else currentAmt += amt;
//         } else {
//           currentAmt += amt;
//         }
//       }

//       const payment = paymentsMap.get(supplier.id) || {};
//       const totalPaid = payment.total_paid || 0;
//       const lastPaymentDate = payment.last_payment_date || null;

//       const outstanding = totalPurchaseAmt - totalPaid;

//       // Basic risk categorization
//       let riskCat = 'Low';
//       if (overdueAmt > 500000) riskCat = 'Critical';
//       else if (overdueAmt > 200000) riskCat = 'High';
//       else if (overdueAmt > 50000) riskCat = 'Medium';

//       if (riskCategory && riskCategory !== '' && riskCategory !== riskCat) return null;

//       const oldestDate = supplierPurchases.length > 0 ? supplierPurchases.reduce((min, inv) => !min || inv.date < min ? inv.date : min, null) : null;
//       const oldestBillDate = oldestDate ? new Date(oldestDate).toISOString().slice(0,10) : '';

//       return {
//         id: supplier.id.toString(),
//         supplierName: supplier.name,
//         supplierGroup: supplier.group_name || '',
//         supplierAddress: supplier.address || '',
//         supplierPhone: supplier.phone || '',
//         supplierEmail: supplier.email || '',
//         supplierGSTIN: supplier.gstin || '',
//         totalOutstanding: Number(outstanding.toFixed(2)),
//         currentDue: Number(currentAmt.toFixed(2)),
//         overdue: Number(overdueAmt.toFixed(2)),
//         creditLimit: 0,
//         creditDays: 0,
//         lastPayment: lastPaymentDate ? { date: lastPaymentDate, amount: totalPaid } : undefined,
//         oldestBillDate,
//         totalBills: supplierPurchases.length,
//         riskCategory: riskCat,
//         ageingBreakdown: {
//           '0-30': currentAmt,
//           '31-60': 0,   // Placeholder for more buckets
//           '61-90': 0,
//           '90+': overdueAmt
//         }
//       };
//     });

//     // Remove any nulls due to riskCategory filter
//     result = result.filter(r => r !== null);

//     // Apply sorting
//     const sortFields = ['amount', 'overdue', 'supplier', 'risk'];
//     if (sortFields.includes(sortBy)) {
//       const riskOrder = { 'Low':1, 'Medium':2, 'High':3, 'Critical':4 };
//       result.sort((a,b) => {
//         let cmp = 0;
//         switch (sortBy) {
//           case 'amount': cmp = a.totalOutstanding - b.totalOutstanding; break;
//           case 'overdue': cmp = a.overdue - b.overdue; break;
//           case 'supplier': cmp = a.supplierName.localeCompare(b.supplierName); break;
//           case 'risk': cmp = riskOrder[a.riskCategory] - riskOrder[b.riskCategory]; break;
//         }
//         return sortOrder === 'desc' ? -cmp : cmp;
//       });
//     }

//     res.json(result);

//   } catch (err) {
//     console.error('Error fetching outstanding payables:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

router.get("/api/outstanding-payables", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, group_id } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: "Missing tenant info" });
    }

    const parentGroupId = group_id ? parseInt(group_id, 10) : -109;

    // 1. Fetch subgroups and calculate their total balance from underlying ledgers
    const groupSql = `
      SELECT 
        lg.id, 
        lg.name, 
        'group' AS entry_type,
        lg.parent,
        COALESCE(SUM(
          (CASE WHEN l.balance_type = 'debit' THEN CAST(COALESCE(l.opening_balance, 0) AS DECIMAL(15,2)) 
                ELSE -CAST(COALESCE(l.opening_balance, 0) AS DECIMAL(15,2)) END) +
          COALESCE((SELECT SUM(total) FROM sales_vouchers WHERE partyId = l.id AND isQuotation = 0 AND (mode IS NULL OR mode != 'accounting-invoice')), 0) -
          COALESCE((SELECT SUM(total) FROM purchase_vouchers WHERE partyId = l.id AND (mode IS NULL OR mode != 'accounting-invoice')), 0) +
          COALESCE((SELECT SUM(amount) FROM voucher_entries WHERE ledger_id = l.id AND entry_type = 'debit'), 0) -
          COALESCE((SELECT SUM(amount) FROM voucher_entries WHERE ledger_id = l.id AND entry_type = 'credit'), 0)
        ), 0) AS net_balance
      FROM ledger_groups lg
      LEFT JOIN ledgers l ON l.group_id = lg.id
      WHERE lg.parent = ? 
        AND lg.company_id = ? 
        AND lg.owner_type = ? 
        AND lg.owner_id = ?
      GROUP BY lg.id
    `;

    // 2. Fetch ledgers (both direct and inside subgroups)
    const ledgerSql = `
      SELECT 
        l.id, 
        l.name, 
        'ledger' AS entry_type,
        l.group_id,
        (
          (CASE WHEN l.balance_type = 'debit' THEN CAST(COALESCE(l.opening_balance, 0) AS DECIMAL(15,2)) 
                ELSE -CAST(COALESCE(l.opening_balance, 0) AS DECIMAL(15,2)) END) +
          COALESCE((SELECT SUM(total) FROM sales_vouchers WHERE partyId = l.id AND isQuotation = 0 AND (mode IS NULL OR mode != 'accounting-invoice')), 0) -
          COALESCE((SELECT SUM(total) FROM purchase_vouchers WHERE partyId = l.id AND (mode IS NULL OR mode != 'accounting-invoice')), 0) +
          COALESCE((SELECT SUM(amount) FROM voucher_entries WHERE ledger_id = l.id AND entry_type = 'debit'), 0) -
          COALESCE((SELECT SUM(amount) FROM voucher_entries WHERE ledger_id = l.id AND entry_type = 'credit'), 0)
        ) AS net_balance
      FROM ledgers l
      WHERE (l.group_id = ? OR l.group_id IN (SELECT id FROM ledger_groups WHERE parent = ?))
        AND l.company_id = ? 
        AND l.owner_type = ? 
        AND l.owner_id = ?
    `;

    const [groups] = await pool.query(groupSql, [parentGroupId, company_id, owner_type, owner_id]);
    const [ledgers] = await pool.query(ledgerSql, [parentGroupId, parentGroupId, company_id, owner_type, owner_id]);

    // Format results to use positive closing_balance and 'debit'/'credit' type
    const formatItem = (item) => ({
      ...item,
      closing_balance: Math.abs(Number(item.net_balance || 0)),
      balance_type: Number(item.net_balance || 0) >= 0 ? 'debit' : 'credit'
    });

    const result = [
      ...groups.map(formatItem),
      ...ledgers.map(formatItem)
    ];

    res.json(result);
  } catch (err) {
    console.error("Outstanding payables error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get single data by id
router.get("/api/outstanding-payables/:id", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id } = req.query;
    const { id: ledgerId } = req.params;

    if (!company_id || !owner_type || !owner_id || !ledgerId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    /* =========================
       1️⃣ PURCHASE VOUCHERS
    ========================== */
    const purchaseSql = `
      SELECT
        id,
        number,
        date,
        partyId ,
        referenceNo,
        subtotal,
        total
      FROM purchase_vouchers
      WHERE company_id = ?
        AND owner_type = ?
        AND owner_id = ?
        AND partyId = ?
      ORDER BY date DESC
    `;

    const [purchaseRows] = await pool.query(purchaseSql, [
      company_id,
      owner_type,
      owner_id,
      ledgerId,
    ]);

    /* =========================
       2️⃣ SALES VOUCHERS
    ========================== */
    const salesSql = `
      SELECT
        id,
        number,
        date,
        partyId ,
        referenceNo,
        subtotal,
        total
      FROM sales_vouchers
      WHERE company_id = ?
        AND owner_type = ?
        AND owner_id = ?
        AND partyId = ?
      ORDER BY date DESC
    `;

    const [salesRows] = await pool.query(salesSql, [
      company_id,
      owner_type,
      owner_id,
      ledgerId,
    ]);

    /* =========================
       3️⃣ RESPONSE (STRUCTURED)
    ========================== */
    res.json({
      ledger_id: Number(ledgerId),
      purchase: purchaseRows,
      sales: salesRows,
    });
  } catch (err) {
    console.error("Outstanding receivables error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
