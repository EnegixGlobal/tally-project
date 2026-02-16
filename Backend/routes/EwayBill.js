const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/ewailbill", async (req, res) => {
  try {
    const { company_id, owner_id, owner_type } = req.query;

    if (!company_id || !owner_id || !owner_type) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

 const [rows] = await pool.query(
`
SELECT
  sv.id,
  sv.number,
  sv.date,
  sv.partyId,

  sv.referenceNo,
  sv.dispatchDocNo,
  sv.dispatchThrough,
  sv.destination,
  sv.approxDistance,

  l.name AS partyName,
  l.address,
  l.email,
  l.phone,
  l.gst_number,
  l.state,
  l.district,

  sv.subtotal,
  sv.cgstTotal,
  sv.sgstTotal,
  sv.igstTotal,
  sv.discountTotal,
  sv.total,

  svi.itemName,
  svi.qtyChange,
  svi.rate,
  svi.hsnCode

FROM sales_vouchers sv

LEFT JOIN ledgers l
  ON l.id = sv.partyId

LEFT JOIN sale_history svi
  ON svi.voucherNumber COLLATE utf8mb4_general_ci
     = sv.number COLLATE utf8mb4_general_ci

WHERE sv.company_id = ?
  AND sv.owner_type COLLATE utf8mb4_general_ci = ?
  AND sv.owner_id = ?
  AND sv.type COLLATE utf8mb4_general_ci = 'sales'

ORDER BY sv.date DESC
`,
[company_id, owner_type, owner_id]
);

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.error("E-Way Bill Error:", err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;