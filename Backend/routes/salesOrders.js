const express = require("express");
const router = express.Router();
const db = require("../db"); // Your DB connection file
const { generateVoucherNumber } = require("../utils/generateVoucherNumber");
const { getFinancialYear } = require("../utils/financialYear");

router.post("/", async (req, res) => {
  const {
    date,
    number,
    referenceNo,
    partyId,
    salesLedgerId,
    orderRef,
    termsOfDelivery,
    dispatchDetails,
    items,
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
    !partyId ||
    !salesLedgerId ||
    !items ||
    items.length === 0
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // ================= GENERATE NUMBER =================
    let finalNumber = number;
    if (!finalNumber) {
      finalNumber = await generateVoucherNumber({
        companyId,
        ownerType,
        ownerId,
        voucherType: "sales_order",
        date,
      });
    }

    // Insert main order, including multi-tenant columns
    const [orderResult] = await connection.query(
      `INSERT INTO sales_orders
      (date, number, referenceNo, partyId, salesLedgerId, orderRef, termsOfDelivery, destination, dispatchThrough, dispatchDocNo,
        narration, expected_delivery_date, status, company_id, owner_type, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        finalNumber,
        referenceNo,
        partyId,
        salesLedgerId,
        orderRef,
        termsOfDelivery,
        dispatchDetails?.destination || "",
        dispatchDetails?.through || "",
        dispatchDetails?.docNo || "",
        narration,
        expectedDeliveryDate || null,
        status || "pending",
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
          entry.hsnCode || "",
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
    res.json({ success: true, message: "Sales Order saved successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error saving Sales Order:", error);
    res
      .status(500)
      .json({ success: false, message: "Error saving Sales Order" });
  } finally {
    connection.release();
  }
});

// GET ALL SALES ORDERS  (GET /api/sales-orders)
router.get("/", async (req, res) => {
  const { companyId, ownerType, ownerId } = req.query;

  if (!companyId || !ownerType || !ownerId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing tenant info" });
  }

  try {
    const [rows] = await db.query(
      `SELECT so.*, 
              p.name AS partyName, 
              sl.name AS salesLedgerName,
              SUM(soi.amount) AS totalAmount,
              COUNT(soi.id) AS itemCount
       FROM sales_orders so
       
       LEFT JOIN ledgers p ON so.partyId = p.id     -- FIXED HERE
       LEFT JOIN ledgers sl ON so.salesLedgerId = sl.id
       LEFT JOIN sales_order_items soi ON so.id = soi.salesOrderId
       
       WHERE so.company_id = ? 
         AND so.owner_type = ? 
         AND so.owner_id = ?
       
       GROUP BY so.id
       ORDER BY so.id DESC`,
      [companyId, ownerType, ownerId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching sales orders:", err);
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
});

// get voucher number
router.get("/next-number", async (req, res) => {
  try {
    const { company_id, owner_type, owner_id, date } = req.query;

    if (!company_id || !owner_type || !owner_id || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    const voucherNumber = await generateVoucherNumber({
      companyId: company_id,
      ownerType: owner_type,
      ownerId: owner_id,
      voucherType: 'sales_order',
      date
    });

    return res.json({
      success: true,
      voucherNumber,
    });
  } catch (err) {
    console.error("Sales Order next-number error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to generate sales order number",
    });
  }
});

// GET SINGLE ORDER (GET /api/sales-orders/:id)

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [orderRows] = await db.query(
      `SELECT so.*, 
          p.name AS partyName,
          sl.name AS salesLedgerName
   FROM sales_orders so
   LEFT JOIN ledgers p ON so.partyId = p.id
   LEFT JOIN ledgers sl ON so.salesLedgerId = sl.id
   WHERE so.id = ?`,
      [id]
    );

    if (orderRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const [items] = await db.query(
      `SELECT soi.*, si.name AS itemName, si.unit
       FROM sales_order_items soi
       LEFT JOIN stock_items si ON soi.itemId = si.id
       WHERE soi.salesOrderId = ?`,
      [id]
    );

    res.json({ success: true, data: { ...orderRows[0], items } });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ success: false, message: "Error fetching order" });
  }
});

// UPDATE ORDER (PUT /api/sales-orders/:id)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    date,
    number,
    referenceNo,
    partyId,
    salesLedgerId,
    orderRef,
    termsOfDelivery,
    dispatchDetails = {},
    items = [],
    narration,
    expectedDeliveryDate,
    status,
    companyId,
    ownerType,
    ownerId,
  } = req.body;

  if (!companyId || !ownerType || !ownerId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing tenant info" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Update main order
    const [updateResult] = await conn.query(
      `UPDATE sales_orders SET
        date=?, number=?, referenceNo=?, partyId=?, salesLedgerId=?, orderRef=?, 
        termsOfDelivery=?, destination=?, dispatchThrough=?, dispatchDocNo=?, 
        narration=?, expectedDeliveryDate=?, status=?
       WHERE id=? AND company_id=? AND owner_type=? AND owner_id=?`,
      [
        date,
        number,
        referenceNo,
        partyId,
        salesLedgerId,
        orderRef,
        termsOfDelivery,
        dispatchDetails.destination || "",
        dispatchDetails.through || "",
        dispatchDetails.docNo || "",
        narration,
        expectedDeliveryDate,
        status,
        id,
        companyId,
        ownerType,
        ownerId,
      ]
    );

    // 🚨 Check if update happened
    if (updateResult.affectedRows === 0) {
      throw new Error("Order not found or tenant mismatch");
    }

    // Delete old items
    await conn.query(`DELETE FROM sales_order_items WHERE salesOrderId=?`, [
      id,
    ]);

    // Insert items
    for (const entry of items) {
      await conn.query(
        `INSERT INTO sales_order_items 
        (salesOrderId, itemId, hsnCode, quantity, rate, discount, amount, godownId,
         cgstRate, sgstRate, igstRate, company_id, owner_type, owner_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          entry.itemId,
          entry.hsnCode || "",
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

    await conn.commit();
    res.json({ success: true, message: "Order updated successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("Order update error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// DELETE ORDER (DELETE /api/sales-orders/:id)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ Get order details before deletion
    const [orderRows] = await conn.execute(
      "SELECT number, company_id, owner_type, owner_id FROM sales_orders WHERE id = ?",
      [id]
    );

    if (orderRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const { number: deletedNumber, company_id, owner_type, owner_id } = orderRows[0];

    // Extract prefix, FY, and sequence: SO/25-26/000002 -> ["SO", "25-26", "000002"]
    const parts = deletedNumber.split("/");
    if (parts.length < 3) {
      // Normal delete if format is unexpected
      await conn.query(`DELETE FROM sales_order_items WHERE salesOrderId=?`, [id]);
      await conn.query(`DELETE FROM sales_orders WHERE id=?`, [id]);
      await conn.commit();
      return res.json({ success: true, message: "Order deleted" });
    }

    const prefix = parts[0];
    const fy = parts[1];
    const deletedSeq = parseInt(parts[2]);

    // 2️⃣ Delete current order and items
    await conn.query(`DELETE FROM sales_order_items WHERE salesOrderId=?`, [id]);
    await conn.query(`DELETE FROM sales_orders WHERE id=?`, [id]);

    // 3️⃣ Renumber subsequent orders of the same FY
    const [subsequentOrders] = await conn.execute(
      `SELECT id, number FROM sales_orders 
       WHERE company_id = ? AND owner_type = ? AND owner_id = ? 
       AND number LIKE ? 
       ORDER BY id ASC`,
      [company_id, owner_type, owner_id, `${prefix}/${fy}/%`]
    );

    for (const order of subsequentOrders) {
      const oParts = order.number.split("/");
      if (oParts.length === 3) {
        const oSeq = parseInt(oParts[2]);
        if (oSeq > deletedSeq) {
          const newSeq = oSeq - 1;
          const newNumber = `${prefix}/${fy}/${String(newSeq).padStart(6, "0")}`;

          await conn.execute(
            "UPDATE sales_orders SET number = ? WHERE id = ?",
            [newNumber, order.id]
          );
        }
      }
    }

    await conn.commit();
    res.json({ success: true, message: "Order deleted and subsequent orders renumbered successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Delete and renumber failed" });
  } finally {
    conn.release();
  }
});

module.exports = router;
