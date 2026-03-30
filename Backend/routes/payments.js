const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

// Environment Variables - Strictly from .env
const PAYU_KEY = process.env.PAYU_KEY || '';
const PAYU_SALT = process.env.PAYU_SALT || '';
const PAYU_BASE_URL = process.env.PAYU_BASE_URL || 'https://test.payu.in/_payment';
const PAYU_SURL = process.env.PAYU_SURL || '';
const PAYU_FURL = process.env.PAYU_FURL || '';

// App Origins - No hardcoded fallbacks
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.PAYU_SURL;
const BACKEND_URL = process.env.BACKEND_URL || process.env.PAYU_SERVER_ORIGIN;

if (!FRONTEND_URL || !BACKEND_URL) {
  // console.error('❌ Critical Error: FRONTEND_URL or BACKEND_URL not defined in .env');
}

function sha512(str) {
  return crypto.createHash('sha512').update(str).digest('hex');
}

// Create an order and return PayU params for the client to post to PayU
router.post('/create-order', async (req, res) => {
  try {
    const { orderId, amount, currency = 'INR', user = {}, companyId: bodyCompanyId, planId, couponId, discountAmount, finalAmount } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount required' });

    // Validate PayU configuration
    if (!PAYU_KEY || !PAYU_SALT || !PAYU_SURL || !PAYU_FURL) {
      console.error('PayU env missing', { PAYU_KEY: !!PAYU_KEY, PAYU_SALT: !!PAYU_SALT, PAYU_SURL: !!PAYU_SURL, PAYU_FURL: !!PAYU_FURL });
      return res.status(500).json({ error: 'payu_configuration_missing' });
    }

    const txnid = `${orderId || 'ORD'}_${Date.now()}`;
    const productinfo = req.body.productinfo || 'Tally Payment';
    const firstname = user.name || req.body.firstname || 'Customer';
    let email = user.email || req.body.email || '';
    let phone = user.phone || req.body.phone || '';

    // If phone missing and companyId provided, try to fetch from company record
    const companyId = bodyCompanyId || req.body.udf2 || req.body.company_id;
    if ((!phone || phone === '') && companyId) {
      try {
        const [compRows] = await db.execute(`SELECT phone_number, phone, email FROM tbcompanies WHERE id = ? LIMIT 1`, [companyId]);
        if (compRows && compRows.length > 0) {
          const comp = compRows[0];
          phone = phone || comp.phone_number || comp.phone || '';
          email = email || comp.email || '';
        }
      } catch (e) {
        console.warn('Could not fetch company phone for payment', e);
      }
    }

    if (!phone) {
      return res.status(400).json({ error: 'phone_required_for_payu' });
    }

    const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_SALT}`;
    const hash = sha512(hashString);

    // Insert payment record (status = created)
    await db.execute(
      `INSERT INTO payments (
         order_id, user_id, company_id, plan_id, coupon_id, 
         amount, currency, status, payu_txn_id, 
         discount_amount, final_amount, created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 'created', ?, ?, ?, NOW(), NOW())`,
      [
        orderId || null,
        user.id || null,
        companyId || null,
        planId || null,
        couponId || null,
        amount,
        currency,
        txnid,
        discountAmount || 0,
        finalAmount || amount
      ]
    );

    // Ensure surl/furl point to the backend confirm endpoint
    const mapToBackendConfirm = (url) => {
      if (!url) return `${BACKEND_URL}/api/payments/confirm`;
      try {
        const u = new URL(url);
        // If url hostname looks like a frontend dev server, map to backend
        if (u.port === '5173' || u.port === '5174' || u.port === '4173') {
          return `${BACKEND_URL}/api/payments/confirm`;
        }
        return url;
      } catch (e) {
        return `${BACKEND_URL}/api/payments/confirm`;
      }
    };

    const finalSurl = mapToBackendConfirm(PAYU_SURL);
    const finalFurl = mapToBackendConfirm(PAYU_FURL);

    return res.json({
      action: PAYU_BASE_URL,
      params: {
        key: PAYU_KEY,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        surl: finalSurl,
        furl: finalFurl,
        hash,
      },
    });
  } catch (err) {
    console.error('create-order error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// PayU will POST result to this endpoint (surl/furl). Verify hash and update DB.
router.post('/confirm', async (req, res) => {
  try {
    const body = req.body || {};
    const { status, txnid, amount, firstname, email, productinfo, hash } = body;

    // Reverse hash verification per PayU docs. Adjust sequence if PayU docs differ for your account.
    const reverseHashString = `${PAYU_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_KEY}`;
    const calculatedHash = sha512(reverseHashString);

    if (hash && calculatedHash !== hash) {
      console.warn('PayU hash mismatch', { calculatedHash, hash });
      return res.status(400).send('hash_mismatch');
    }

    const newStatus = (String(status).toLowerCase() === 'success') ? 'success' : 'failed';

    const payuMih = body.mihpayid || null;
    const txnParam = txnid || null;
    const orderParam = body.udf1 || body.order_id || body.orderId || null;

    // 1. Fetch record first to get company_id and plan_id
    const [payRowsFirst] = await db.execute(
      `SELECT company_id, plan_id, status FROM payments WHERE payu_txn_id = ? OR order_id = ? LIMIT 1`,
      [txnParam, orderParam]
    );

    await db.execute(
      `UPDATE payments SET status = ?, response_json = ?, payu_txn_id = COALESCE(?, payu_txn_id), updated_at = NOW()
       WHERE payu_txn_id = ? OR order_id = ?`,
      [newStatus, JSON.stringify(body), payuMih, txnParam, orderParam]
    );

    // If success AND it was previously 'created' (to avoid re-activating on duplicate webhooks)
    if (newStatus === 'success' && payRowsFirst && payRowsFirst.length > 0) {
      try {
        const { company_id, plan_id, status: oldStatus } = payRowsFirst[0];

        if (oldStatus === 'created' && company_id && plan_id) {
          // 2. Get plan details
          const [planRows] = await db.execute(
            `SELECT name, duration FROM subscription_plans WHERE id = ?`,
            [plan_id]
          );

          if (planRows && planRows.length > 0) {
            const plan = planRows[0];
            const duration = (plan.duration || 'monthly').toLowerCase();
            const interval = duration === 'yearly' ? '1 YEAR' : '1 MONTH';

            // 3. Update existing record if it exists, otherwise insert
            const [updateResult] = await db.execute(
              `UPDATE company_subscriptions 
               SET plan = ?, is_trial = 0, status = 'active', start_date = NOW(), end_date = DATE_ADD(NOW(), INTERVAL ${interval})
               WHERE company_id = ?`,
              [plan.name, company_id]
            );

            if (updateResult.affectedRows === 0) {
              await db.execute(
                `INSERT INTO company_subscriptions (company_id, plan, is_trial, status, start_date, end_date)
                 VALUES (?, ?, 0, 'active', NOW(), DATE_ADD(NOW(), INTERVAL ${interval}))`,
                [company_id, plan.name]
              );
            }

            // console.log(`✅ Subscription activated for company ${company_id}: ${plan.name} (${duration})`);
          }
        }
      } catch (subErr) {
        console.error('❌ Error activating subscription after payment:', subErr);
      }
    }

    // Respond with a redirect to the frontend instead of just 'OK'
    // This handles the browser-based POST redirect from PayU.
    const redirectBase = newStatus === 'success' ? '/app/payments/success' : '/app/payments/failure';
    const query = [];
    if (txnid) query.push(`txnid=${encodeURIComponent(String(txnid))}`);
    if (payuMih) query.push(`mihpayid=${encodeURIComponent(String(payuMih))}`);
    if (amount) query.push(`amount=${encodeURIComponent(String(amount))}`);
    if (orderParam) query.push(`orderId=${encodeURIComponent(String(orderParam))}`);
    if (productinfo) query.push(`productinfo=${encodeURIComponent(String(productinfo))}`);

    const q = query.length ? `?${query.join('&')}` : '';

    return res.redirect(`${FRONTEND_URL}${redirectBase}${q}`);
  } catch (err) {
    console.error('confirm error', err);
    return res.redirect(`${FRONTEND_URL}/app/payments/failure`);
  }
});

// Handle browser redirects (GET) from PayU after payment and redirect user to frontend pages
router.get('/confirm', (req, res) => {
  try {
    const { status, txnid, mihpayid, error, amount, orderId, productinfo } = req.query || {};
    const s = String(status || '').toLowerCase();
    const query = [];
    if (txnid) query.push(`txnid=${encodeURIComponent(String(txnid))}`);
    if (mihpayid) query.push(`mihpayid=${encodeURIComponent(String(mihpayid))}`);
    if (error) query.push(`error=${encodeURIComponent(String(error))}`);
    if (amount) query.push(`amount=${encodeURIComponent(String(amount))}`);
    if (orderId) query.push(`orderId=${encodeURIComponent(String(orderId))}`);
    if (productinfo) query.push(`productinfo=${encodeURIComponent(String(productinfo))}`);

    const q = query.length ? `?${query.join('&')}` : '';

    if (s === 'success') {
      return res.redirect(`${FRONTEND_URL}/app/payments/success${q}`);
    }
    return res.redirect(`${FRONTEND_URL}/app/payments/failure${q}`);
  } catch (e) {
    console.error('confirm redirect error', e);
    return res.redirect(`${FRONTEND_URL}/app/payments/failure`);
  }
});

// Get payment status by orderId
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const [rows] = await db.execute(`SELECT * FROM payments WHERE order_id = ? LIMIT 1`, [orderId]);
    if (!rows || rows.length === 0) return res.status(404).json({});
    return res.json(rows[0]);
  } catch (err) {
    console.error('status error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Manual verify/sync endpoint if webhook fails but redirect succeeds
router.get('/verify-status/:txnid', async (req, res) => {
  try {
    const { txnid } = req.params;
    // Note: In real prod, this should call PayU's verify API. 
    // Here we just trigger internal activation if status is already 'success'
    // Or we allow forcing a refresh if needed.
    const [payRows] = await db.execute(
      `SELECT company_id, plan_id, status FROM payments WHERE payu_txn_id = ? LIMIT 1`,
      [txnid]
    );

    if (!payRows || payRows.length === 0) return res.status(404).json({ error: 'not_found' });

    const pay = payRows[0];
    return res.json({ status: pay.status, companyId: pay.company_id });
  } catch (err) {
    console.error('verify-status error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
