const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2/promise pool
const { getFinancialYear } = require("../utils/financialYear");
const { generateVoucherNumber } = require("../utils/generateVoucherNumber");

// Create Purchase Order
router.post("/", async (req, res) => {
  const {
    date,
    number,
    partyId,
    purchaseLedgerId,
    referenceNo,
    narration,
    items = [],
    dispatchDetails = {},
    orderRef,
    termsOfDelivery,
    expectedDeliveryDate,
    status = "pending",
    companyId,
    ownerType,
    ownerId,
  } = req.body;

  if (
    !date ||
    !partyId ||
    !purchaseLedgerId ||
    !items.length ||
    !companyId ||
    !ownerType ||
    !ownerId
  ) {
    return res.status(400).json({
      message:
        "Missing required fields: date, partyId, purchaseLedgerId, companyId, ownerType, ownerId, and items are required",
    });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Insert into purchase_orders table
    const [orderResult] = await conn.execute(
      `INSERT INTO purchase_orders (
        date, number, party_id, purchase_ledger_id, reference_no, narration,
        order_ref, terms_of_delivery, expected_delivery_date, status,
        dispatch_destination, dispatch_through, dispatch_doc_no,
        company_id, owner_type, owner_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        number || null,
        partyId,
        purchaseLedgerId,
        referenceNo || null,
        narration || null,
        orderRef || null,
        termsOfDelivery || null,
        expectedDeliveryDate || null,
        status,
        dispatchDetails.destination || null,
        dispatchDetails.through || null,
        dispatchDetails.docNo || null,
        companyId,
        ownerType,
        ownerId,
      ]
    );

    const purchaseOrderId = orderResult.insertId;

    // Insert items into purchase_order_items table
    for (const item of items) {
      if (!item.itemId || !item.quantity || !item.rate) {
        throw new Error("Each item must have itemId, quantity, and rate");
      }

      await conn.execute(
        `INSERT INTO purchase_order_items (
          purchase_order_id, item_id, hsn_code, quantity, rate, discount, amount, godown_id,
          company_id, owner_type, owner_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          purchaseOrderId,
          item.itemId,
          item.hsnCode || null,
          item.quantity,
          item.rate,
          item.discount || 0,
          item.amount || item.quantity * item.rate - (item.discount || 0),
          item.godownId || null,
          companyId,
          ownerType,
          ownerId,
        ]
      );
    }

    await conn.commit();
    conn.release();

    res.status(201).json({
      message: "Purchase Order created successfully",
      purchaseOrderId,
      number: number || `PO${purchaseOrderId.toString().padStart(4, "0")}`,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("Purchase Order creation failed:", err);
    res.status(500).json({
      message: "Failed to create Purchase Order",
      error: err.message,
    });
  }
});




// Get all Purchase Orders with filters (FIXED)

router.get("/", async (req, res) => {
  const {
    status,
    partyId,
    fromDate,
    toDate,
    page = 1,
    limit = 50,
  } = req.query;

  try {
    let whereClause = "WHERE 1=1";
    const params = [];

    /* ===============================
       FILTERS
    =============================== */
    if (status) {
      whereClause += " AND po.status = ?";
      params.push(status);
    }

    // 🔥 IMPORTANT: filter by purchase_ledger_id
    if (partyId) {
      whereClause += " AND po.purchase_ledger_id = ?";
      params.push(partyId);
    }

    if (fromDate) {
      whereClause += " AND po.date >= ?";
      params.push(fromDate);
    }

    if (toDate) {
      whereClause += " AND po.date <= ?";
      params.push(toDate);
    }

    const offset = (Number(page) - 1) * Number(limit);

    /* ===============================
       MAIN DATA QUERY
    =============================== */
    const [rows] = await db.execute(
      `
      SELECT
        po.id,
        po.date,
        po.number,
        po.reference_no,
        po.status,
        po.narration,

        -- ✅ FRONTEND "Party" COLUMN WILL USE THIS
        po.purchase_ledger_id AS partyId,
        purchaseLedger.name  AS party_name,

        -- 🔹 Supplier info (optional, future use)
        po.party_id           AS supplierId,
        supplier.name         AS supplier_name,
        supplier.gst_number   AS supplier_gst,

        -- Summary
        COUNT(poi.id)                AS item_count,
        COALESCE(SUM(poi.amount), 0) AS totalAmount

      FROM purchase_orders po

      LEFT JOIN ledgers supplier
        ON po.party_id = supplier.id

      LEFT JOIN ledgers purchaseLedger
        ON po.purchase_ledger_id = purchaseLedger.id

      LEFT JOIN purchase_order_items poi
        ON po.id = poi.purchase_order_id

      ${whereClause}

      GROUP BY po.id
      ORDER BY po.date DESC, po.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), offset]
    );

    /* ===============================
       TOTAL COUNT (PAGINATION)
    =============================== */
    const [countRows] = await db.execute(
      `
      SELECT COUNT(DISTINCT po.id) AS total
      FROM purchase_orders po
      ${whereClause}
      `,
      params
    );

    /* ===============================
       RESPONSE
    =============================== */
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countRows[0].total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countRows[0].total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Error fetching Purchase Orders:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Purchase Orders",
      error: err.message,
    });
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

    const fy = getFinancialYear(date);
    const month = String(new Date(date).getMonth() + 1).padStart(2, "0");

    const prefix = "PO";

    const [rows] = await db.query(
      `
      SELECT number
      FROM purchase_orders
      WHERE company_id = ?
        AND owner_type = ?
        AND owner_id = ?
        AND number LIKE ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [
        company_id,
        owner_type,
        owner_id,
        `${prefix}/${fy}/${month}/%`,
      ]
    );

    let nextNo = 1;

    if (rows.length > 0) {
      const lastNumber = rows[0].number;
      const lastSeq = Number(lastNumber.split("/").pop());
      nextNo = lastSeq + 1;
    }

    const voucherNumber = `${prefix}/${fy}/${month}/${String(nextNo).padStart(
      6,
      "0"
    )}`;

    res.json({
      success: true,
      voucherNumber,
    });
  } catch (err) {
    console.error("PO next-number error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to generate PO number",
    });
  }
});


// Get Purchase Order by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;


  try {
    // 🔥 SAME COLUMNS AS LIST GET
    const [orderRows] = await db.execute(
      `
      SELECT
        po.id,
        po.date,
        po.number,
        po.reference_no,
        po.status,
        po.narration,
        po.expected_delivery_date AS expectedDeliveryDate,

        po.party_id           AS partyId,
        po.purchase_ledger_id AS purchaseLedgerId,

        supplier.name       AS party_name,
        supplier.gst_number AS party_gst,

        purchaseLedger.name AS purchase_ledger_name,

        COALESCE(SUM(poi.amount), 0) AS totalAmount

      FROM purchase_orders po

      LEFT JOIN ledgers supplier
        ON po.party_id = supplier.id

      LEFT JOIN ledgers purchaseLedger
        ON po.purchase_ledger_id = purchaseLedger.id

      LEFT JOIN purchase_order_items poi
        ON po.id = poi.purchase_order_id

      WHERE po.id = ?
      GROUP BY po.id
      `,
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Purchase Order not found" });
    }

    // 🔥 ITEMS (NO extra columns)
    const [itemRows] = await db.execute(
      `
      SELECT
        poi.id,
        poi.item_id,
        poi.hsn_code,
        poi.quantity,
        poi.rate,
        poi.discount,
        poi.amount,
        poi.godown_id,

        si.name AS item_name,
        si.unit

      FROM purchase_order_items poi
      LEFT JOIN stock_items si ON poi.item_id = si.id
      WHERE poi.purchase_order_id = ?
      ORDER BY poi.id
      `,
      [id]
    );

    res.json({
      ...orderRows[0],   // 🔥 same as list
      items: itemRows,   // 🔥 extra only here
    });
  } catch (err) {
    console.error("Error fetching Purchase Order:", err);
    res.status(500).json({
      message: "Failed to fetch Purchase Order",
      error: err.message,
    });
  }
});


// Update Purchase Order status
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    /* ===============================
       1️⃣ PURCHASE ORDERS UPDATE
    =============================== */

    const fieldMap = {
      date: "date",
      number: "number",
      partyId: "party_id",
      purchaseLedgerId: "purchase_ledger_id",
      referenceNo: "reference_no",
      narration: "narration",
      orderRef: "order_ref",
      termsOfDelivery: "terms_of_delivery",
      expectedDeliveryDate: "expected_delivery_date",
      status: "status",
      companyId: "company_id",
      ownerType: "owner_type",
      ownerId: "owner_id",
    };

    const setParts = [];
    const values = [];

    for (const key in fieldMap) {
      if (body[key] !== undefined) {
        setParts.push(`${fieldMap[key]} = ?`);
        values.push(body[key]);
      }
    }

    // dispatchDetails mapping
    if (body.dispatchDetails) {
      const d = body.dispatchDetails;
      if (d.destination !== undefined) {
        setParts.push("dispatch_destination = ?");
        values.push(d.destination);
      }
      if (d.through !== undefined) {
        setParts.push("dispatch_through = ?");
        values.push(d.through);
      }
      if (d.docNo !== undefined) {
        setParts.push("dispatch_doc_no = ?");
        values.push(d.docNo);
      }
    }

    if (setParts.length > 0) {
      const updateOrderSql = `
        UPDATE purchase_orders
        SET ${setParts.join(", ")}, updated_at = NOW()
        WHERE id = ?
      `;

      await conn.execute(updateOrderSql, [...values, id]);
    }

    /* ===============================
       2️⃣ PURCHASE ORDER ITEMS UPDATE
    =============================== */

    if (Array.isArray(body.items)) {
      // 🔥 delete old items
      await conn.execute(
        "DELETE FROM purchase_order_items WHERE purchase_order_id = ?",
        [id]
      );

      // 🔥 insert new items
      for (const item of body.items) {
        await conn.execute(
          `
          INSERT INTO purchase_order_items
          (
            purchase_order_id,
            item_id,
            hsn_code,
            quantity,
            rate,
            discount,
            amount,
            godown_id,
            company_id,
            owner_type,
            owner_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            id,
            item.itemId,
            item.hsnCode || null,
            item.quantity,
            item.rate,
            item.discount || 0,
            item.amount,
            item.godownId || null,
            body.companyId,
            body.ownerType,
            body.ownerId,
          ]
        );
      }
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Purchase Order updated successfully",
    });
  } catch (err) {
    await conn.rollback();
    console.error("PUT PURCHASE ORDER ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to update Purchase Order",
      error: err.message,
    });
  } finally {
    conn.release();
  }
});



// Delete Purchase Order
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({
      message: "Invalid Purchase Order ID",
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 🔎 Check PO
    const [orderRows] = await conn.execute(
      "SELECT status FROM purchase_orders WHERE id = ?",
      [Number(id)]
    );

    if (orderRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Purchase Order not found" });
    }

    const status = String(orderRows[0].status || "").toLowerCase();

    if (["completed", "partially_received"].includes(status)) {
      await conn.rollback();
      return res.status(400).json({
        message:
          "Cannot delete Purchase Order that is completed or partially received",
      });
    }

    // 🔥 DELETE CHILD FIRST
    await conn.execute(
      "DELETE FROM purchase_order_items WHERE purchase_order_id = ?",
      [Number(id)]
    );

    // 🔥 DELETE PARENT
    await conn.execute(
      "DELETE FROM purchase_orders WHERE id = ?",
      [Number(id)]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "Purchase Order deleted successfully",
      id: Number(id),
    });
  } catch (err) {
    await conn.rollback();
    console.error("Delete PO Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete Purchase Order",
      error: err.message,
    });
  } finally {
    conn.release();
  }
});


module.exports = router;
