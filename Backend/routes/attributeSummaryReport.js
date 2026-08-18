const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ success: false, message: "company_id is required" });
    }

    // Solve SQL fan-out by pre-aggregating purchases and sales
    const query = `
      SELECT
        t.primary_attribute_value as prime_attribute,
        MAX(sa.name) as attribute_name,
        MAX(si.name) as item_name,
        (
          SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('name', sa2.name, 'value', tsa.sub_attribute_value)), ']')
          FROM tracking_sub_attributes tsa
          JOIN stock_attributes sa2 ON tsa.sub_attribute_id = sa2.id
          WHERE tsa.tracking_id = (
            SELECT MAX(tsa2.tracking_id)
            FROM stock_item_attribute_tracking t2
            JOIN tracking_sub_attributes tsa2 ON t2.id = tsa2.tracking_id
            WHERE t2.stock_item_id = t.stock_item_id 
              AND t2.primary_attribute_value = t.primary_attribute_value
          )
        ) as sub_attributes,
        COALESCE(SUM(CASE WHEN t.mode = 'opening' THEN t.quantity ELSE 0 END), 0) AS opening_qty,
        COALESCE(SUM(p.purchase_qty), 0) AS purchase_qty,
        COALESCE(SUM(s.sales_qty), 0) AS sales_qty
      FROM stock_item_attribute_tracking t
      JOIN stock_items si ON t.stock_item_id = si.id
      LEFT JOIN stock_attributes sa ON t.primary_attribute_id = sa.id
      LEFT JOIN (
        SELECT pvi.tracking_id, SUM(pvi.quantity) as purchase_qty
        FROM purchase_voucher_items pvi
        JOIN purchase_vouchers pv ON pvi.voucherId = pv.id
        WHERE pv.company_id = ?
        GROUP BY pvi.tracking_id
      ) p ON p.tracking_id = t.id
      LEFT JOIN (
        SELECT svi.tracking_id, SUM(svi.quantity) as sales_qty
        FROM sales_voucher_items svi
        JOIN sales_vouchers sv ON svi.voucherId = sv.id
        WHERE sv.company_id = ?
        GROUP BY svi.tracking_id
      ) s ON s.tracking_id = t.id
      WHERE si.company_id = ?
      GROUP BY t.primary_attribute_value, t.stock_item_id
      HAVING opening_qty > 0 OR purchase_qty > 0 OR sales_qty > 0
      ORDER BY MAX(si.name), t.primary_attribute_value
    `;

    const [rows] = await db.execute(query, [company_id, company_id, company_id]);

    const formattedData = rows.map((row) => {
      let subAttributes = [];
      try {
        if (row.sub_attributes) {
          subAttributes = JSON.parse(row.sub_attributes);
        }
      } catch (e) {
        console.error("Failed to parse sub_attributes", e);
      }
      
      return {
        item_name: row.item_name,
        prime_attribute: row.prime_attribute,
        attribute_name: row.attribute_name || 'Attribute',
        sub_attributes: subAttributes,
        opening: Number(row.opening_qty),
        purchase: Number(row.purchase_qty),
        sales: Number(row.sales_qty),
        closing: Number(row.opening_qty) + Number(row.purchase_qty) - Number(row.sales_qty)
      };
    });

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error("Error fetching attribute summary report:", error);
    res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
});

module.exports = router;
