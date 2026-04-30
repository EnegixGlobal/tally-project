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
  salesTypeId, // Added salesTypeId
}) {
  const config = CONFIG_MAP[voucherType];
  if (!config) {
    throw new Error(`Unsupported voucher type: ${voucherType}`);
  }

  const { table, column, typeCol } = config;
  let prefix = config.prefix;
  let suffix = "";
  let useTypeFilter = false;

  // 🔹 Fetch custom prefix/suffix if salesTypeId is provided
  if (voucherType === "sales" && salesTypeId && salesTypeId !== "custom") {
    try {
      const [stRows] = await db.execute(
        "SELECT prefix, suffix FROM sales_types WHERE id = ?",
        [salesTypeId]
      );
      if (stRows.length > 0) {
        prefix = stRows[0].prefix || "";
        suffix = stRows[0].suffix || "";
        useTypeFilter = true;
      }
    } catch (err) {
      console.error("Error fetching sales type for numbering:", err);
    }
  }

  const fy = getFinancialYear(date);
  const searchPattern = useTypeFilter ? null : `${prefix}/${fy}/%`;

  let sql = `
    SELECT ${column} as lastNumber
    FROM ${table}
    WHERE company_id = ? AND owner_type = ? AND owner_id = ?
  `;

  const params = [companyId, ownerType, ownerId];

  if (useTypeFilter) {
    sql += ` AND sales_type_id = ?`;
    params.push(salesTypeId);
  } else {
    sql += ` AND ${column} LIKE ?`;
    params.push(searchPattern);
  }

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

    if (useTypeFilter) {
      // Follow frontend format: prefix + suffix + "/" + nextNo
      return `${prefix}${suffix}/${nextNo}`;
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
async function renumberVouchers(
  { companyId, ownerType, ownerId, voucherType, date, salesTypeId },
  connection = null
) {
  const config = CONFIG_MAP[voucherType];
  if (!config) return;

  const executor = connection || db;
  const { table, column, typeCol } = config;
  let prefix = config.prefix;
  let suffix = "";
  let useTypeFilter = false;

  // 🔹 Fetch custom prefix/suffix if salesTypeId is provided
  if (voucherType === "sales" && salesTypeId && salesTypeId !== "custom") {
    try {
      const [stRows] = await executor.execute(
        "SELECT prefix, suffix FROM sales_types WHERE id = ?",
        [salesTypeId]
      );
      if (stRows.length > 0) {
        prefix = stRows[0].prefix || "";
        suffix = stRows[0].suffix || "";
        useTypeFilter = true;
      }
    } catch (err) {
      console.error("Error fetching sales type for renumbering:", err);
    }
  }

  const fy = getFinancialYear(date);
  const searchPattern = useTypeFilter ? null : `${prefix}/${fy}/%`;

  console.log(
    `[renumberVouchers] Starting for ${voucherType} (TypeID: ${salesTypeId}) in FY ${fy}`
  );

  let sql = `
    SELECT id, date, ${column} as oldNumber 
    FROM ${table} 
    WHERE company_id = ? AND owner_type = ? AND owner_id = ? 
  `;
  const params = [companyId, ownerType, ownerId];

  if (useTypeFilter) {
    sql += ` AND sales_type_id = ?`;
    params.push(salesTypeId);
  } else {
    sql += ` AND ${column} LIKE ?`;
    params.push(searchPattern);
  }

  if (typeCol) {
    sql += ` AND ${typeCol} = ?`;
    params.push(voucherType);
  }

  sql += ` ORDER BY date ASC, id ASC`;

  try {
    const [vouchers] = await executor.execute(sql, params);

    // 🔹 Sync current_no in sales_types (Always do this if salesTypeId is provided to keep sequences in sync)
    if (useTypeFilter) {
      const nextNo = vouchers.length + 1;
      console.log(
        `[renumberVouchers] Syncing sales_types TypeID ${salesTypeId} current_no to ${nextNo}`
      );
      await executor.execute(
        "UPDATE sales_types SET current_no = ? WHERE id = ?",
        [nextNo, salesTypeId]
      );
    }

    if (vouchers.length === 0) return;

    // 1. Temporarily move all to a non-conflicting sequence to avoid UNIQUE constraint errors
    for (const v of vouchers) {
      await executor.execute(
        `UPDATE ${table} SET ${column} = CONCAT(${column}, '_TEMP') WHERE id = ?`,
        [v.id]
      );
    }

    // 2. Now re-assign correctly in order
    for (let i = 0; i < vouchers.length; i++) {
      const newSeq = i + 1;
      let newNumber;

      if (useTypeFilter) {
        newNumber = `${prefix}${suffix}/${newSeq}`;
      } else {
        newNumber = `${prefix}/${fy}/${String(newSeq).padStart(6, "0")}`;
      }

      const oldNumber = vouchers[i].oldNumber;

      console.log(
        `[renumberVouchers] Updating voucher ${vouchers[i].id}: ${oldNumber} -> ${newNumber}`
      );

      await executor.execute(`UPDATE ${table} SET ${column} = ? WHERE id = ?`, [
        newNumber,
        vouchers[i].id,
      ]);

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

    console.log(
      `[renumberVouchers] Successfully renumbered ${vouchers.length} vouchers.`
    );
  } catch (err) {
    console.error(`[renumberVouchers] ERROR:`, err);
    throw err;
  }
}


module.exports = { generateVoucherNumber, renumberVouchers };
