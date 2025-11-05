const express = require('express');
const router = express.Router();
const db = require('../db'); // Your DB connection file

router.post('/', async (req, res) => {
  const {
    date,
    number,
    referenceNo,
    partyId,
    salesLedgerId,
    orderRef,
    termsOfDelivery,
    dispatchDetails,
    items, // renamed from 'entries' for clarity, as in frontend
    narration,
    expectedDeliveryDate,
    status,
    companyId,
    ownerType,
    ownerId,
  } = req.body;

  // Multi-tenant check
  if (
    !companyId ||
    !ownerType ||
    !ownerId ||
    !date ||
    !number ||
    !partyId ||
    !salesLedgerId ||
    !items ||
    items.length === 0
  ) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Insert main order, including multi-tenant columns
    const [orderResult] = await connection.query(
      `INSERT INTO sales_orders 
      (date, number, referenceNo, partyId, salesLedgerId, orderRef, termsOfDelivery, destination, dispatchThrough, dispatchDocNo,
        narration, expectedDeliveryDate, status, company_id, owner_type, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        number,
        referenceNo,
        partyId,
        salesLedgerId,
        orderRef,
        termsOfDelivery,
        dispatchDetails?.destination || '',
        dispatchDetails?.through || '',
        dispatchDetails?.docNo || '',
        narration,
        expectedDeliveryDate || null,
        status || 'pending',
        companyId,
        ownerType,
        ownerId,
      ]
    );

    const salesOrderId = orderResult.insertId;

    // Insert order items and (optionally) store tenant info in each item as well
    for (const entry of items) {
      await connection.query(
        `INSERT INTO sales_order_items
        (salesOrderId, itemId, hsnCode, quantity, rate, discount, amount, godownId, cgstRate, sgstRate, igstRate, company_id, owner_type, owner_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          salesOrderId,
          entry.itemId,
          entry.hsnCode || '',
          entry.quantity,
          entry.rate,
          entry.discount || 0,
          entry.amount,
          entry.godownId || null,
          entry.cgstRate ?? 0,
          entry.sgstRate ?? 0,
          entry.igstRate ?? 0,
          companyId,
          ownerType,
          ownerId,
        ]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Sales Order saved successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving Sales Order:', error);
    res.status(500).json({ success: false, message: 'Error saving Sales Order' });
  } finally {
    connection.release();
  }
});
module.exports = router;
