const express = require('express');
const router = express.Router();
const db = require('../db'); // mysql2 promise pool

function calculateAgeingBucket(diffDays) {
  if (diffDays <= 30) return '0-30';
  if (diffDays <= 60) return '31-60';
  if (diffDays <= 90) return '61-90';
  return '90+';
}

const safeArray = (arr) => (Array.isArray(arr) && arr.length ? arr : [-1]);

router.get('/api/billwise-receivables', async (req, res) => {
  try {
    const {
      searchTerm = '',
      partyName = '',
      selectedAgeingBucket = '',
      selectedRiskCategory = '',
      sortBy = 'amount',
      sortOrder = 'desc',
      limit = '100',
      offset = '0',
      company_id,
      owner_type,
      owner_id,
    } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: 'Missing tenant parameters (company_id, owner_type, owner_id)' });
    }

    const limitNum = parseInt(limit, 10) || 100;
    const offsetNum = parseInt(offset, 10) || 0;
    const searchPattern = `%${searchTerm.toLowerCase()}%`;

    const partyConditions = [
      'LOWER(l.name) LIKE ?',
      'l.company_id = ?',
      'l.owner_type = ?',
      'l.owner_id = ?'
    ];
    const partyParams = [searchPattern, company_id, owner_type, owner_id];

    if (partyName) {
      partyConditions.push('LOWER(l.name) = ?');
      partyParams.push(partyName.toLowerCase());
    }

    const partySql = `
      SELECT l.id, l.name, lg.name AS partyGroup, l.address, l.phone, l.email, l.gst_number AS gstin
      FROM ledgers l
      LEFT JOIN ledger_groups lg ON l.group_id = lg.id
      WHERE ${partyConditions.join(' AND ')}
      LIMIT ? OFFSET ?
    `;
    partyParams.push(limitNum, offsetNum);

    const [parties] = await db.query(partySql, partyParams);

    if (parties.length === 0) {
      return res.json([]);
    }

    const partyIds = parties.map(p => p.id);
    const safePartyIds = safeArray(partyIds);

    // Fetch sales invoices (assuming sales_vouchers table)
    const salesSql = `
      SELECT sv.id AS billId, sv.number AS billNo, sv.date AS billDate, sv.date AS dueDate,
             sv.partyId, sv.total AS billAmount, sv.referenceNo AS reference, sv.narration,
             l.name AS partyName, lg.name AS partyGroup, l.address AS partyAddress,
             l.phone AS partyPhone, l.email AS partyEmail, l.gst_number AS partyGSTIN
      FROM sales_vouchers sv
      JOIN ledgers l ON sv.partyId = l.id
      LEFT JOIN ledger_groups lg ON l.group_id = lg.id
      WHERE sv.partyId IN (?)
        AND sv.company_id = ?
        AND sv.owner_type = ?
        AND sv.owner_id = ?
    `;
    const [sales] = await db.query(salesSql, [safePartyIds, company_id, owner_type, owner_id]);

    // Fetch payments related to sales invoices from voucher_main + voucher_entries
    const paymentsSql = `
      SELECT ve.ledger_id AS partyId, ve.voucher_id AS billId,
             SUM(CASE WHEN ve.entry_type = 'credit' THEN ve.amount ELSE 0 END) AS totalPaid
      FROM voucher_entries ve
      JOIN voucher_main vm ON ve.voucher_id = vm.id
      WHERE vm.voucher_type IN ('receipt', 'payment', 'contra', 'journal')
        AND ve.ledger_id IN (?)
        AND vm.company_id = ?
        AND vm.owner_type = ?
        AND vm.owner_id = ?
      GROUP BY ve.voucher_id, ve.ledger_id
    `;
    const [payments] = await db.query(paymentsSql, [safePartyIds, company_id, owner_type, owner_id]);

    // Map payments by billId
    const paymentsMap = new Map();
    payments.forEach(p => {
      // Key by billId for accurate payment per invoice
      paymentsMap.set(p.billId, p.totalPaid);
    });

    const today = new Date();

    // Build final result combining sales and payments
    const bills = sales.map(sale => {
      const billDate = sale.billDate ? new Date(sale.billDate) : null;
      const dueDate = sale.dueDate ? new Date(sale.dueDate) : null;

      const billAmount = parseFloat(sale.billAmount) || 0;
      const paidAmount = paymentsMap.get(sale.billId) || 0;
      const outstandingAmount = billAmount - paidAmount;

      let overdueDays = 0;
      if (dueDate) {
        overdueDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
      }

      const ageingBucket = calculateAgeingBucket(overdueDays);

      let riskCat = 'Low';
      if (overdueDays > 90 && outstandingAmount > 50000) riskCat = 'Critical';
      else if (overdueDays > 60 && outstandingAmount > 30000) riskCat = 'High';
      else if (overdueDays > 30 && outstandingAmount > 10000) riskCat = 'Medium';

      if (selectedRiskCategory && selectedRiskCategory !== '' && riskCat !== selectedRiskCategory) {
        return null;
      }
      if (selectedAgeingBucket && ageingBucket !== selectedAgeingBucket) {
        return null;
      }

      return {
        id: sale.billId.toString(),
        billNo: sale.billNo,
        billDate: billDate ? billDate.toISOString().slice(0, 10) : null,
        dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : null,
        partyId: sale.partyId,
        partyName: sale.partyName,
        partyGroup: sale.partyGroup || '',
        partyAddress: sale.partyAddress,
        partyPhone: sale.partyPhone,
        partyEmail: sale.partyEmail,
        partyGSTIN: sale.partyGSTIN,
        billAmount,
        paidAmount,
        outstandingAmount,
        overdueDays,
        ageingBucket,
        riskCategory: riskCat,
        reference: sale.reference,
        narration: sale.narration,
      };
    }).filter(i => i !== null);

    // Sorting logic as before
    const sortableFields = ['amount', 'overdue', 'party', 'date'];
    if (sortableFields.includes(sortBy)) {
      const riskOrder = { Low: 1, Medium: 2, High: 3, Critical: 4 };
      bills.sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case 'amount': cmp = a.outstandingAmount - b.outstandingAmount; break;
          case 'overdue': cmp = a.overdueDays - b.overdueDays; break;
          case 'party': cmp = a.partyName.localeCompare(b.partyName); break;
          case 'date': cmp = new Date(a.billDate).getTime() - new Date(b.billDate).getTime(); break;
        }
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    }

    res.json(bills);

  } catch (error) {
    console.error('Error in bill-wise outstanding:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
