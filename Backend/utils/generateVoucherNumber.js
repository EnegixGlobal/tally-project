const db = require("../db");
const { getFinancialYear } = require("./financialYear");

/**
 * 🔹 Voucher type → { Prefix, Table, Column } mapping
 */
const CONFIG_MAP = {
  payment: { prefix: "PV", table: "voucher_main", column: "voucher_number", typeCol: "voucher_type" },
  receipt: { prefix: "RV", table: "voucher_main", column: "voucher_number", typeCol: "voucher_type" },
  contra: { prefix: "CV", table: "voucher_main", column: "voucher_number", typeCol: "voucher_type" },
  journal: { prefix: "JV", table: "voucher_main", column: "voucher_number", typeCol: "voucher_type" },
  purchase: { prefix: "PRV", table: "purchase_vouchers", column: "number" },
  sales: { prefix: "SLV", table: "sales_vouchers", column: "number" },
  purchase_order: { prefix: "PO", table: "purchase_orders", column: "number" },
  sales_order: { prefix: "SO", table: "sales_orders", column: "number" },
  bank: { prefix: "BV", table: "voucher_main", column: "voucher_number", typeCol: "voucher_type" },
};

/**
 * 🔹 Generate voucher number (Tally-style)
 * Always picks the next available number based on existing data.
 */
async function generateVoucherNumber({
  companyId,
  ownerType,
  ownerId,
  voucherType, // e.g. payment, purchase, sales_order
  date,
}) {
  const config = CONFIG_MAP[voucherType];
  if (!config) {
    throw new Error(`Unsupported voucher type: ${voucherType}`);
  }

  const { prefix, table, column, typeCol } = config;
  const fy = getFinancialYear(date);

  // We look for numbers starting with "PREFIX/FY/"
  const searchPattern = `${prefix}/${fy}/%`;

  let sql = `
    SELECT ${column} as lastNumber
    FROM ${table}
    WHERE company_id = ? AND owner_type = ? AND owner_id = ?
    AND ${column} LIKE ?
  `;

  const params = [companyId, ownerType, ownerId, searchPattern];

  // For voucher_main, we must also filter by voucher_type
  if (typeCol) {
    sql += ` AND ${typeCol} = ?`;
    params.push(voucherType);
  }

  sql += ` ORDER BY ${column} DESC LIMIT 1`;
  
  try {
    const [rows] = await db.execute(sql, params);
    console.log(`[generateVoucherNumber] last row for ${voucherType}:`, rows[0]);

    let nextNo = 1;
    if (rows.length > 0) {
      const lastNumber = rows[0].lastNumber;
      if (lastNumber) {
        const parts = lastNumber.split("/");
        const lastSeq = parseInt(parts[parts.length - 1]);
        nextNo = (isNaN(lastSeq) ? 0 : lastSeq) + 1;
      }
    }

    return `${prefix}/${fy}/${String(nextNo).padStart(6, "0")}`;
  } catch (err) {
    console.error("Error generating voucher number:", err);
    throw err;
  }
}

module.exports = { generateVoucherNumber };
