const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your MySQL connection pool

function safeArrayParams(arr) {
  if (Array.isArray(arr) && arr.length > 0) return arr;
  return [0]; // fallback for SQL IN ()
}

// Helper to parse int safely
function toInt(v, def = 0) {
  const n = parseInt(v, 10);
  return isNaN(n) ? def : n;
}

router.get('/api/outstanding-receivables', async (req, res) => {
  try {
    const {
      searchTerm = '',
      customerGroup = '',
      riskCategory = '',
      sortBy = 'amount',
      sortOrder = 'desc',
      limit = 100,
      offset = 0,
      company_id,
      owner_type,
      owner_id,
    } = req.query;

    // Multi-tenant check
    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: "Missing tenant parameters (company_id, owner_type, owner_id)" });
    }

    const searchPattern = `%${(searchTerm).toLowerCase()}%`;
    const groupsFilterSql = customerGroup ? 'AND lg.name = ?' : '';
    const groupsFilterParams = customerGroup ? [customerGroup] : [];

    // 1. Query customers scoped by tenant and other filters
    const customersSql = `
      SELECT 
        l.id, l.name, lg.name AS group_name, l.address, l.phone, l.email, l.gst_number AS gstin
      FROM ledgers l
      LEFT JOIN ledger_groups lg ON lg.id = l.group_id
      WHERE LOWER(l.name) LIKE ?
        AND l.company_id = ? AND l.owner_type = ? AND l.owner_id = ?
        ${groupsFilterSql}
      LIMIT ? OFFSET ?
    `;
    const customersParams = [
      searchPattern,
      company_id, owner_type, owner_id,
      ...groupsFilterParams,
      toInt(limit, 100), toInt(offset, 0)
    ];
    const [customers] = await pool.query(customersSql, customersParams);

    if (!customers.length) return res.json([]);

    const custIds = customers.map(c => c.id);
    const safeCustIds = safeArrayParams(custIds);

    // 2. Fetch invoices (sales vouchers)
    const invoiceSql = `
      SELECT vm.id as voucher_id, vm.voucher_type, vm.voucher_number, vm.date, ve.ledger_id as customer_id,
        SUM(CASE WHEN ve.entry_type = 'debit' THEN ve.amount ELSE 0 END) AS debit_amount,
        SUM(CASE WHEN ve.entry_type = 'credit' THEN ve.amount ELSE 0 END) AS credit_amount,
        MAX(vm.due_date) AS due_date
      FROM voucher_main vm
      JOIN voucher_entries ve ON ve.voucher_id = vm.id
      WHERE vm.voucher_type LIKE '%sale%'
        AND vm.company_id = ? AND vm.owner_type = ? AND vm.owner_id = ?
        AND ve.ledger_id IN (?)
      GROUP BY vm.id, ve.ledger_id
    `;
    const [invoices] = await pool.query(invoiceSql, [company_id, owner_type, owner_id, safeCustIds]);

    // 3. Fetch payments (receipt/payment vouchers)
    const paymentSql = `
      SELECT ve.ledger_id AS customer_id,
        SUM(CASE WHEN ve.entry_type = 'credit' THEN ve.amount ELSE 0 END) AS total_paid,
        MAX(vm.date) AS last_payment_date
      FROM voucher_main vm
      JOIN voucher_entries ve ON ve.voucher_id = vm.id
      WHERE vm.voucher_type IN ('receipt', 'payment')
        AND vm.company_id = ? AND vm.owner_type = ? AND vm.owner_id = ?
        AND ve.ledger_id IN (?)
      GROUP BY ve.ledger_id
    `;
    const [payments] = await pool.query(paymentSql, [company_id, owner_type, owner_id, safeCustIds]);
    const paymentsMap = new Map();
    for (const p of payments) {
      paymentsMap.set(p.customer_id, {
        lastPaymentDate: p.last_payment_date,
        totalPaid: p.total_paid,
      });
    }

    const today = new Date();

    // Build response with ageing logic
    let results = customers.map(cust => {
      const custInvoices = invoices.filter(inv => inv.customer_id === cust.id);
      let totalInvoiceAmt = 0;
      let overdueAmt = 0;
      let currentAmt = 0;
      // Naive buckets, can be improved to proper 30/60/90+ logic
      let bucket30 = 0, bucket60 = 0, bucket90 = 0, bucket90p = 0;

      custInvoices.forEach(inv => {
        const invAmount = inv.debit_amount - inv.credit_amount;
        totalInvoiceAmt += invAmount;
        if (inv.due_date) {
          const dueDate = new Date(inv.due_date);
          const ageDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          if (ageDays > 90) bucket90p += invAmount;
          else if (ageDays > 60) bucket90 += invAmount;
          else if (ageDays > 30) bucket60 += invAmount;
          else if (ageDays > 0) bucket30 += invAmount;
          if (ageDays > 0) overdueAmt += invAmount;
          else currentAmt += invAmount;
        } else {
          currentAmt += invAmount;
        }
      });

      const payment = paymentsMap.get(cust.id);
      const totalPaid = payment?.totalPaid ?? 0;
      const lastPayment = payment?.lastPaymentDate ?? null;
      const outstanding = totalInvoiceAmt - totalPaid;

      // Very basic risk logic
      let riskCat = 'Low';
      if (overdueAmt > 500000) riskCat = 'Critical';
      else if (overdueAmt > 200000) riskCat = 'High';
      else if (overdueAmt > 50000) riskCat = 'Medium';

      // Optionally filter by riskCategory
      if (riskCategory && riskCategory !== riskCat) return null;

      // Find oldest bill date
      let oldestBillDate = null;
      if (custInvoices.length) {
        oldestBillDate = custInvoices.reduce((oldest, i) => (!oldest || i.date < oldest ? i.date : oldest), null);
        oldestBillDate = oldestBillDate ? new Date(oldestBillDate).toISOString().slice(0, 10) : null;
      }

      return {
        id: cust.id.toString(),
        customerName: cust.name,
        customerGroup: cust.group_name ?? '',
        customerAddress: cust.address ?? '',
        customerPhone: cust.phone ?? '',
        customerEmail: cust.email ?? '',
        customerGSTIN: cust.gstin ?? '',
        totalOutstanding: Number(outstanding.toFixed(2)),
        currentDue: Number(currentAmt.toFixed(2)),
        overdue: Number(overdueAmt.toFixed(2)),
        creditLimit: 0,    // Replace if you have the field
        creditDays: 0,     // Replace if you have the field
        lastPayment: lastPayment ? { date: lastPayment, amount: totalPaid } : undefined,
        oldestBillDate,
        totalBills: custInvoices.length,
        riskCategory: riskCat,
        ageingBreakdown: {
          '0-30': bucket30,
          '31-60': bucket60,
          '61-90': bucket90,
          '90+': bucket90p
        }
      };
    }).filter(r => r !== null);

    // Sort as per params
    if (['amount', 'overdue', 'customer', 'risk'].includes(sortBy)) {
      const riskOrder = { Low: 1, Medium: 2, High: 3, Critical: 4 };
      results.sort((a, b) => {
        let comp = 0;
        switch (sortBy) {
          case 'amount': comp = a.totalOutstanding - b.totalOutstanding; break;
          case 'overdue': comp = a.overdue - b.overdue; break;
          case 'customer': comp = a.customerName.localeCompare(b.customerName); break;
          case 'risk': comp = riskOrder[a.riskCategory] - riskOrder[b.riskCategory]; break;
        }
        return sortOrder === 'desc' ? -comp : comp;
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Error fetching outstanding receivables', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
