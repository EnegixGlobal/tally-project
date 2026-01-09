const db = require("../db");
const { getFinancialYear } = require("./financialYear");

/**
 * 🔹 Ensure voucher_sequences table exists (runtime safe)
 */
async function ensureVoucherSequenceTable(conn) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS voucher_sequences (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,

      company_id BIGINT NOT NULL,
      owner_type VARCHAR(50) NOT NULL,
      owner_id BIGINT NOT NULL,

      voucher_type VARCHAR(50) NOT NULL,
      financial_year VARCHAR(9) NOT NULL,
      month TINYINT NOT NULL,

      current_no INT NOT NULL DEFAULT 0,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      UNIQUE KEY uq_voucher_seq (
        company_id,
        owner_type,
        owner_id,
        voucher_type,
        financial_year,
        month
      )
    )
  `);
}

/**
 * 🔹 Voucher type → Prefix mapping
 * 👉 Add new voucher types HERE only
 */
const PREFIX_MAP = {
  payment: "PV",
  purchase: "PRV",
  sales: "SLV",
  receipt: "RV",
  contra: "CV",
  journal: "JV",
};

/**
 * 🔹 Generate voucher number (Tally-style)
 *
 * Format:
 *   PV/25-26/01/000001
 */
async function generateVoucherNumber({
  companyId,
  ownerType,
  ownerId,
  voucherType, // logical type: payment / purchase / sales
  date,
}) {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Ensure table exists
    await ensureVoucherSequenceTable(conn);

    // 2️⃣ Resolve prefix (fallback safe)
    const prefix = PREFIX_MAP[voucherType] || voucherType.toUpperCase();

    // 3️⃣ Financial year + month
    const fy = getFinancialYear(date); // e.g. 25-26
    const month = new Date(date).getMonth() + 1; // 1–12

    // 4️⃣ Lock sequence row (race-condition safe)
    const [rows] = await conn.execute(
      `
      SELECT id, current_no
      FROM voucher_sequences
      WHERE company_id = ?
        AND owner_type = ?
        AND owner_id = ?
        AND voucher_type = ?
        AND financial_year = ?
        AND month = ?
      FOR UPDATE
      `,
      [companyId, ownerType, ownerId, voucherType, fy, month]
    );

    let nextNo = 1;

    if (rows.length === 0) {
      // 5️⃣ First voucher for this month/FY/type
      await conn.execute(
        `
        INSERT INTO voucher_sequences
        (company_id, owner_type, owner_id,
         voucher_type, financial_year, month, current_no)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        `,
        [companyId, ownerType, ownerId, voucherType, fy, month]
      );
    } else {
      // 6️⃣ Increment counter
      nextNo = rows[0].current_no + 1;
      await conn.execute(
        `UPDATE voucher_sequences SET current_no = ? WHERE id = ?`,
        [nextNo, rows[0].id]
      );
    }

    // 7️⃣ Final voucher number
    const voucherNumber = `${prefix}/${fy}/${String(month).padStart(
      2,
      "0"
    )}/${String(nextNo).padStart(6, "0")}`;

    await conn.commit();
    return voucherNumber;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { generateVoucherNumber };
