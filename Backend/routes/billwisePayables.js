const express = require('express');
const router = express.Router();
const pool = require('../db'); // mysql2 promise pool

function calcAgeingBucket(days) {
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

const safeArray = (arr) => (Array.isArray(arr) && arr.length ? arr : [-1]);

router.get('/api/billwise-payables', async (req, res) => {
  try {
    const {
      searchTerm = '',
      selectedSupplier = '',
      selectedAgeingBucket = '',
      selectedRiskCategory = '',
      sortBy = 'amount',
      sortOrder = 'desc',
      limit = '100',
      offset = '0',
      company_id,
      owner_type,
      owner_id, // owner_id
    } = req.query;

    if (!company_id || !owner_type || !owner_id) {
      return res.status(400).json({ error: 'Missing tenant parameters (company_id, owner_type, owner_id)' });
    }

    const limitNum = Math.max(1, parseInt(limit, 10) || 100);
    const offsetNum = Math.max(0, parseInt(offset, 10) || 0);

    // Step 1: Get suppliers within tenant + search term
    let supplierQuery = `
      SELECT l.id, l.name, lg.name AS supplierGroup, l.address, l.phone, l.gst_number AS supplierGSTIN
      FROM ledgers l
      LEFT JOIN ledger_groups lg ON l.group_id = lg.id
      WHERE LOWER(l.name) LIKE ?
      AND l.company_id = ? AND l.owner_type = ? AND l.owner_id = ?
      LIMIT ? OFFSET ?
    `;
    const supplierParams = [`%${searchTerm.toLowerCase()}%`, company_id, owner_type, owner_id, limitNum, offsetNum];
    const [suppliers] = await pool.query(supplierQuery, supplierParams);

    if (suppliers.length === 0) {
      return res.json([]);
    }

    const supplierIds = suppliers.map(s => s.id);
    const safeSupplierIds = safeArray(supplierIds);

    // Step 2: Get purchase vouchers & aggregated amounts
    const billsQuery = `
      SELECT
        pv.id AS bill_id,
        pv.number AS billNo,
        pv.date AS billDate,
        pv.date AS dueDate,
        pv.referenceNo AS reference,
        pv.narration AS narration,
        pv.partyId AS supplierId,
        l.name AS supplierName,
        lg.name AS supplierGroup,
        l.address AS supplierAddress,
        l.phone AS supplierPhone,
        l.gst_number AS supplierGSTIN,
        pv.total AS billAmount
      FROM purchase_vouchers pv
      LEFT JOIN ledgers l ON pv.partyId = l.id
      LEFT JOIN ledger_groups lg ON l.group_id = lg.id
      WHERE pv.partyId IN (?)
      AND pv.company_id = ? AND pv.owner_type = ? AND pv.owner_id = ?
      LIMIT 1000
    `;
    const [bills] = await pool.query(billsQuery, [safeSupplierIds, company_id, owner_type, owner_id]);

    // Step 3: Get payments against those bills from voucher tables
    const paymentsQuery = `
      SELECT ve.voucher_id AS voucherId, ve.ledger_id AS supplierId,
        SUM(CASE WHEN ve.entry_type = 'debit' THEN ve.amount ELSE 0 END) AS paidAmount
      FROM voucher_entries ve
      JOIN voucher_main vm ON ve.voucher_id = vm.id
      WHERE vm.voucher_type IN ('payment', 'receipt', 'contra', 'journal')
      AND ve.ledger_id IN (?)
      AND vm.company_id = ? AND vm.owner_type = ? AND vm.owner_id = ?
      GROUP BY ve.voucher_id, ve.ledger_id
    `;
    const [payments] = await pool.query(paymentsQuery, [safeSupplierIds, company_id, owner_type, owner_id]);

    // Map payments to voucher id + supplier id (if you want total per bill)
    const paymentsMap = new Map();
    payments.forEach(p => paymentsMap.set(p.voucherId, p.paidAmount));

    const today = new Date();

    // Compose response
    const results = bills.map(bill => {
      const billDate = bill.billDate ? new Date(bill.billDate) : null;
      const dueDate = bill.dueDate ? new Date(bill.dueDate) : null;

      const billAmount = parseFloat(bill.billAmount) || 0;
      const paidAmount = paymentsMap.get(bill.bill_id) || 0;
      const outstanding = billAmount - paidAmount;

      let overdueDays = 0;
      if (dueDate && !isNaN(dueDate)) {
        overdueDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
      }

      const ageingBucket = calcAgeingBucket(overdueDays);

      let riskCategory = "Low";
      if (overdueDays > 90 && outstanding > 50000) riskCategory = "Critical";
      else if (overdueDays > 60 && outstanding > 30000) riskCategory = "High";
      else if (overdueDays > 30 && outstanding > 10000) riskCategory = "Medium";

      if (selectedRiskCategory && riskCategory !== selectedRiskCategory) return null;
      if (selectedAgeingBucket && ageingBucket !== selectedAgeingBucket) return null;

      return {
        id: bill.bill_id.toString(),
        billNo: bill.billNo,
        billDate: billDate ? billDate.toISOString().slice(0, 10) : '',
        dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : '',
        supplierId: bill.supplierId,
        supplierName: bill.supplierName,
        supplierGroup: bill.supplierGroup,
        supplierAddress: bill.supplierAddress,
        supplierPhone: bill.supplierPhone,
        supplierGSTIN: bill.supplierGSTIN,
        billAmount: billAmount,
        paidAmount: paidAmount,
        outstandingAmount: outstanding,
        overdueDays: overdueDays,
        ageingBucket: ageingBucket,
        riskCategory: riskCategory,
        reference: bill.reference || '',
        narration: bill.narration || '',
        creditLimit: 0
      };
    }).filter(Boolean);

    // Sorting
    const sortFields = ['amount', 'overdue', 'supplier', 'date'];
    if (sortFields.includes(sortBy)) {
      results.sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case 'amount':
            cmp = a.outstandingAmount - b.outstandingAmount;
            break;
          case 'overdue':
            cmp = a.overdueDays - b.overdueDays;
            break;
          case 'supplier':
            cmp = a.supplierName.localeCompare(b.supplierName);
            break;
          case 'date':
            cmp = new Date(a.billDate) - new Date(b.billDate);
            break;
        }
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Error fetching bill-wise payables:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
