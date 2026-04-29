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
  debit_note: { prefix: "DNV", table: "debit_note_vouchers", column: "number" },
  credit_note: { prefix: "CNV", table: "credit_vouchers", column: "number" },
};

/**
 * 🔹 Generate voucher number (Tally-style)
 */
async function generateVoucherNumber({
  companyId,
  ownerType,
  ownerId,
  voucherType,
  date,
}) {
  const config = CONFIG_MAP[voucherType];
  if (!config) {
    throw new Error(`Unsupported voucher type: ${voucherType}`);
  }

  const { prefix, table, column, typeCol } = config;
  const fy = getFinancialYear(date);
  const searchPattern = `${prefix}/${fy}/%`;

  let sql = `
    SELECT ${column} as lastNumber
    FROM ${table}
    WHERE company_id = ? AND owner_type = ? AND owner_id = ?
    AND ${column} LIKE ?
  `;

  const params = [companyId, ownerType, ownerId, searchPattern];

  if (typeCol) {
    sql += ` AND ${typeCol} = ?`;
    params.push(voucherType);
  }

  sql += ` ORDER BY ${column} DESC LIMIT 1`;
  
  try {
    const [rows] = await db.execute(sql, params);
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

/**
 * 🔹 Chronological Renumbering Logic
 */
async function renumberVouchers({ companyId, ownerType, ownerId, voucherType, date }, connection = null) {
  const config = CONFIG_MAP[voucherType];
  if (!config) return;

  const executor = connection || db;
  const { prefix, table, column, typeCol } = config;
  const fy = getFinancialYear(date);
  const searchPattern = `${prefix}/${fy}/%`;

  console.log(`[renumberVouchers] Starting for ${voucherType} in FY ${fy}`);

  let sql = `
    SELECT id, date, ${column} as oldNumber 
    FROM ${table} 
    WHERE company_id = ? AND owner_type = ? AND owner_id = ? 
    AND ${column} LIKE ?
  `;
  const params = [companyId, ownerType, ownerId, searchPattern];

  if (typeCol) {
    sql += ` AND ${typeCol} = ?`;
    params.push(voucherType);
  }

  sql += ` ORDER BY date ASC, id ASC`;

  try {
    const [vouchers] = await executor.execute(sql, params);
    if (vouchers.length === 0) return;

    // 1. Temporarily move all to a non-conflicting sequence to avoid UNIQUE constraint errors
    // We append '_TEMP' to each number
    for (const v of vouchers) {
      await executor.execute(
        `UPDATE ${table} SET ${column} = CONCAT(${column}, '_TEMP') WHERE id = ?`,
        [v.id]
      );
    }

    // 2. Now re-assign correctly in order
    for (let i = 0; i < vouchers.length; i++) {
      const newSeq = i + 1;
      const newNumber = `${prefix}/${fy}/${String(newSeq).padStart(6, "0")}`;
      const oldNumber = vouchers[i].oldNumber;

      console.log(`[renumberVouchers] Updating voucher ${vouchers[i].id}: ${oldNumber} -> ${newNumber}`);
      
      await executor.execute(
        `UPDATE ${table} SET ${column} = ? WHERE id = ?`,
        [newNumber, vouchers[i].id]
      );

      // Update related history
      if (table === "purchase_vouchers") {
        await executor.execute(
          `UPDATE purchase_history SET voucherNumber = ? WHERE voucherNumber = ? AND companyId = ?`,
          [newNumber, oldNumber, companyId]
        );
      } else if (table === "sales_vouchers") {
        await executor.execute(
          `UPDATE sale_history SET voucherNumber = ? WHERE voucherNumber = ? AND companyId = ?`,
          [newNumber, oldNumber, companyId]
        );
      }
    }
    
    console.log(`[renumberVouchers] Successfully renumbered ${vouchers.length} vouchers.`);
  } catch (err) {
    console.error(`[renumberVouchers] ERROR:`, err);
    throw err;
  }
}

module.exports = { generateVoucherNumber, renumberVouchers };
