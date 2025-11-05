const express = require('express');
const router = express.Router();
const pool = require('../db');

function calcAgeingBucket(days) {
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

const safeArray = (arr) => (Array.isArray(arr) && arr.length ? arr : [-1]);

router.get('/api/outstanding-ledger', async (req, res) => {
  try {
    const {
      type = 'sales',
      ledgerName = '',
      searchTerm = '',
      from = '',
      to = '',
      sortBy = 'party',
      sortOrder = 'asc',
      companyId,
      ownerType,
      ownerId,
    } = req.query;

    if (!companyId || !ownerType || !ownerId) {
      return res.status(400).json({ error: 'Missing tenant parameters (companyId, ownerType, ownerId)' });
    }

    const limitNum = 100;
    const offsetNum = 0;

    const params = [companyId, ownerType, ownerId];
    const filters = [
      `${type === 'sales' ? 'sv' : 'pv'}.company_id = ?`,
      `${type === 'sales' ? 'sv' : 'pv'}.owner_type = ?`,
      `${type === 'sales' ? 'sv' : 'pv'}.owner_id = ?`
    ];

    if (ledgerName) {
      filters.push("LOWER(l.name) = ?");
      params.push(ledgerName.toLowerCase());
    }
    if (from) {
      filters.push(`${type === 'sales' ? 'sv' : 'pv'}.date >= ?`);
      params.push(from);
    }
    if (to) {
      filters.push(`${type === 'sales' ? 'sv' : 'pv'}.date <= ?`);
      params.push(to);
    }

    // Get parties
    const partiesSql = `
      SELECT DISTINCT l.id, l.name
      FROM ledgers l
      JOIN ${type === 'sales' ? 'sales_vouchers sv' : 'purchase_vouchers pv'}
        ON l.id = ${type === 'sales' ? 'sv.partyId' : 'pv.partyId'}
      WHERE ${filters.join(' AND ')}
      LIMIT ? OFFSET ?
    `;
    params.push(limitNum, offsetNum);

    const [parties] = await pool.query(partiesSql, params);

    if (parties.length === 0) {
      return res.json([]);
    }

    const partyIds = parties.map(p => p.id);
    const safePartyIds = safeArray(partyIds);

    // Get bills
    const billsSql = `
      SELECT
        ${type === 'sales' ? 'sv' : 'pv'}.id as voucherId,
        ${type === 'sales' ? 'sv' : 'pv'}.number as billNo,
        ${type === 'sales' ? 'sv' : 'pv'}.date as billDate,
        ${type === 'sales' ? 'sv' : 'pv'}.date as dueDate,
        l.id as ledgerId,
        l.name as ledgerName,
        ${type === 'sales' ? 'sv' : 'pv'}.total as billAmount
      FROM ${type === 'sales' ? 'sales_vouchers sv' : 'purchase_vouchers pv'}
      JOIN ledgers l ON l.id = ${type === 'sales' ? 'sv.partyId' : 'pv.partyId'}
      WHERE ${type === 'sales' ? 'sv' : 'pv'}.partyId IN (?)
        AND ${type === 'sales' ? 'sv' : 'pv'}.company_id = ?
        AND ${type === 'sales' ? 'sv' : 'pv'}.owner_type = ?
        AND ${type === 'sales' ? 'sv' : 'pv'}.owner_id = ?
      ORDER BY l.name, ${type === 'sales' ? 'sv' : 'pv'}.date DESC
    `;
    const [bills] = await pool.query(billsSql, [safePartyIds, companyId, ownerType, ownerId]);

    // Get payments from voucher_main + voucher_entries
    const paymentsSql = `
      SELECT ve.voucher_id AS voucherId, SUM(ve.amount) AS paidAmount
      FROM voucher_entries ve
      JOIN voucher_main vm ON ve.voucher_id = vm.id
      WHERE vm.voucher_type IN ('payment', 'receipt', 'contra', 'journal')
        AND ve.voucher_id IN (?)
        AND vm.company_id = ? AND vm.owner_type = ? AND vm.owner_id = ?
      GROUP BY ve.voucher_id
    `;
    const voucherIds = bills.map(b => b.voucherId);
    const safeVoucherIds = safeArray(voucherIds);

    const [payments] = await pool.query(paymentsSql, [safeVoucherIds, companyId, ownerType, ownerId]);
    const paymentsMap = new Map(payments.map(p => [p.voucherId, p.paidAmount]));

    const today = new Date();

    // Compose result
    const results = bills.map(bill => {
      const billDate = bill.billDate ? new Date(bill.billDate) : null;
      const dueDate = bill.dueDate ? new Date(bill.dueDate) : billDate ? new Date(billDate.getTime() + 30 * 86400000) : null;

      const billAmount = parseFloat(bill.billAmount) || 0;
      const paidAmount = parseFloat(paymentsMap.get(bill.voucherId)) || 0;
      const outstanding = billAmount - paidAmount;

      let overdueDays = 0;
      if (dueDate) {
        overdueDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
      }

      const ageingBucket = calcAgeingBucket(overdueDays);

      let riskCategory = 'Low';
      if (overdueDays > 90 && outstanding > 50000) riskCategory = 'Critical';
      else if (overdueDays > 60 && outstanding > 30000) riskCategory = 'High';
      else if (overdueDays > 30 && outstanding > 10000) riskCategory = 'Medium';

      return {
        id: bill.voucherId,
        billNo: bill.billNo,
        billDate: billDate ? billDate.toISOString().slice(0, 10) : '',
        dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : '',
        outstandingAmount: outstanding,
        paidAmount,
        billAmount,
        overdueDays,
        ageingBucket,
        riskCategory,
        ledgerName: bill.ledgerName,
        type, // 'sales' or 'purchase'
      };
    });

    // Optional search filter in JS
    const filtered = searchTerm
      ? results.filter(item =>
          item.ledgerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.billNo.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : results;

    // Sorting
    const sortableFields = ['amount', 'overdue', 'party', 'date'];
    if (sortableFields.includes(sortBy)) {
      filtered.sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case 'amount': cmp = a.outstandingAmount - b.outstandingAmount; break;
          case 'overdue': cmp = a.overdueDays - b.overdueDays; break;
          case 'party': cmp = a.ledgerName.localeCompare(b.ledgerName); break;
          case 'date': cmp = new Date(a.billDate) - new Date(b.billDate); break;
        }
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching ledger-wise outstanding:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
