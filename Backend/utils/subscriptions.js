const ms = require('ms');

/**
 * Upsert a company subscription using plan_id and payment_id.
 * - companyId: numeric company id
 * - planId: id from subscription_plans
 * - paymentRecordId: payments.id (numeric)
 * - planDuration: 'monthly'|'yearly' (string)
 */
async function upsertCompanySubscription(db, companyId, planId, paymentRecordId, planDuration = 'monthly') {
  if (!companyId || !planId) return;

  const startDate = new Date();

  // Fiscal year logic: April (4) to March (3).
  // Any purchase between April..Dec => expiry is March 31 of next calendar year.
  // Any purchase between Jan..Mar => expiry is March 31 of current calendar year.
  const month = startDate.getMonth() + 1; // 1-12
  let fiscalEndYear;
  if (month >= 4) {
    fiscalEndYear = startDate.getFullYear() + 1;
  } else {
    fiscalEndYear = startDate.getFullYear();
  }

  // Set end date to March 31 at end of day
  const endDate = new Date(fiscalEndYear, 2, 31, 23, 59, 59, 999);

  // See if an existing subscription row exists for the company
  const [rows] = await db.execute(
    `SELECT id FROM company_subscriptions WHERE company_id = ? LIMIT 1`,
    [companyId]
  );

  if (rows && rows.length > 0) {
    // Update existing
    await db.execute(
      `UPDATE company_subscriptions
         SET plan_id = ?, payment_id = ?, is_trial = 0, status = 'active', start_date = ?, end_date = ?, updated_at = NOW()
       WHERE company_id = ?`,
      [planId, paymentRecordId, startDate, endDate, companyId]
    );
  } else {
    // Insert new
    await db.execute(
      `INSERT INTO company_subscriptions (company_id, plan_id, payment_id, is_trial, status, start_date, end_date, created_at, updated_at)
       VALUES (?, ?, ?, 0, 'active', ?, ?, NOW(), NOW())`,
      [companyId, planId, paymentRecordId, startDate, endDate]
    );
  }

  // Return the latest subscription row for this company so callers can inspect dates/status
  try {
    const [latest] = await db.execute(
      `SELECT id, plan_id as plan, is_trial, status, start_date, end_date FROM company_subscriptions WHERE company_id = ? ORDER BY end_date DESC LIMIT 1`,
      [companyId]
    );
    if (latest && latest.length > 0) return latest[0];
  } catch (e) {
    // ignore
  }

  return null;
}

module.exports = { upsertCompanySubscription };
