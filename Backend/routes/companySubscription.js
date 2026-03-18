const express = require('express');
const router = express.Router();
const db = require('../db');

// Get subscription / trial status for a company
router.get('/status/:companyId', async (req, res) => {
  const { companyId } = req.params;

  if (!companyId) {
    return res.status(400).json({ success: false, message: 'companyId is required' });
  }

  try {
    // Ensure table exists (defensive)
    const [subscriptionTable] = await db.query(
      "SHOW TABLES LIKE 'company_subscriptions'"
    );

    if (subscriptionTable.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          hasSubscription: false,
          isTrial: false,
          status: 'expired',
          daysRemaining: 0,
          isExpired: true,
        },
      });
    }

    const [rows] = await db.query(
      `
        SELECT 
          id,
          plan,
          is_trial,
          status,
          start_date,
          end_date
        FROM company_subscriptions
        WHERE company_id = ?
        ORDER BY end_date DESC
        LIMIT 1
      `,
      [companyId]
    );

    if (!rows.length) {
      return res.status(200).json({
        success: true,
        data: {
          hasSubscription: false,
          isTrial: false,
          status: 'expired',
          daysRemaining: 0,
          isExpired: true,
        },
      });
    }

    const s = rows[0];
    const now = new Date();
    const end = new Date(s.end_date);
    const msDiff = end.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    const isExpired =
      msDiff < 0 || s.status === 'expired' || s.status === 'cancelled';

    return res.json({
      success: true,
      data: {
        id: s.id,
        plan: s.plan,
        isTrial: !!s.is_trial,
        status: isExpired ? 'expired' : s.status,
        startDate: s.start_date,
        endDate: s.end_date,
        daysRemaining: isExpired ? 0 : Math.max(daysRemaining, 0),
        isExpired,
        hasSubscription: true,
      },
    });
  } catch (err) {
    console.error('Error fetching company subscription status:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;

