const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../db');

const router = express.Router();

// Environment Variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL ;
const BACKEND_URL = process.env.BACKEND_URL ;

let razorpay = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('Razorpay credentials not found in env: RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET');
}

function verifyRazorpaySignature(order_id, payment_id, signature) {
  try {
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(`${order_id}|${payment_id}`);
    const generated = hmac.digest('hex');
    return generated === signature;
  } catch (e) {
    return false;
  }
}

// Create an order and return Razorpay order details for the client
router.post('/create-order', async (req, res) => {
  try {
    const { orderId, amount, currency = 'INR', user = {}, companyId: bodyCompanyId, planId, couponId, discountAmount, finalAmount } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount required' });

    if (!razorpay) return res.status(500).json({ error: 'razorpay_not_configured' });

    const txnid = `${orderId || 'ORD'}_${Date.now()}`;
    const receipt = txnid;

    // get phone/email if missing
    let email = user.email || req.body.email || '';
    let phone = user.phone || req.body.phone || '';
    const companyId = bodyCompanyId || req.body.company_id;
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

    const amountInPaise = Math.round(Number(finalAmount || amount) * 100);

    const options = {
      amount: amountInPaise,
      currency,
      receipt,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Insert payment record (status = created)
    await db.execute(
      `INSERT INTO payments (
         order_id, user_id, company_id, plan_id, coupon_id,
         amount, currency, status, razorpay_order_id, 
         discount_amount, final_amount, created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 'created', ?, ?, ?, NOW(), NOW())`,
      [
        orderId || null,
        user.id || null,
        companyId || null,
        planId || null,
        couponId || null,
        finalAmount || amount,
        currency,
        order.id,
        discountAmount || 0,
        finalAmount || amount,
      ]
    );

    return res.json({
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: RAZORPAY_KEY_ID,
      receipt,
    });
  } catch (err) {
    console.error('create-order (razorpay) error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Confirm endpoint for client-checkout (POST) — verifies signature and updates DB
router.post('/confirm', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: 'missing_parameters' });
    }

    const valid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) {
      console.warn('Razorpay signature mismatch', { razorpay_order_id, razorpay_payment_id });
      return res.status(400).json({ error: 'invalid_signature' });
    }

    // Fetch payment details from Razorpay to confirm final status
    let paymentDetails = null;
    try {
      if (!razorpay) throw new Error('razorpay_not_configured');
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (e) {
      console.warn('Could not fetch payment details from Razorpay', e && e.error ? e.error : e);
    }

    const finalStatus = paymentDetails && paymentDetails.status ? paymentDetails.status : 'unknown';

    if (finalStatus !== 'captured') {
      // Mark as failed in DB with response JSON
      await db.execute(
        `UPDATE payments SET status = ?, response_json = ?, razorpay_payment_id = COALESCE(?, razorpay_payment_id), updated_at = NOW()
         WHERE razorpay_order_id = ? LIMIT 1`,
        ['failed', JSON.stringify({ body: req.body, paymentDetails }), razorpay_payment_id, razorpay_order_id]
      );

      const isAjax = req.headers['content-type'] && req.headers['content-type'].includes('application/json');
      const reason = (paymentDetails && (paymentDetails.error_reason || paymentDetails.status)) || 'payment_not_captured';
      if (isAjax) return res.status(400).json({ ok: false, reason, paymentDetails });
      return res.redirect(`${FRONTEND_URL}/app/payments/failure?reason=${encodeURIComponent(String(reason))}`);
    }

    // At this point payment is captured - update DB and continue
    await db.execute(
      `UPDATE payments SET status = ?, response_json = ?, razorpay_payment_id = COALESCE(?, razorpay_payment_id), updated_at = NOW()
       WHERE razorpay_order_id = ? LIMIT 1`,
      ['success', JSON.stringify({ body: req.body, paymentDetails }), razorpay_payment_id, razorpay_order_id]
    );

    // Activate subscription if applicable
    const [payRowsFirst] = await db.execute(
      `SELECT company_id, plan_id, status FROM payments WHERE razorpay_order_id = ? LIMIT 1`,
      [razorpay_order_id]
    );

    if (payRowsFirst && payRowsFirst.length > 0) {
      const { company_id, plan_id, status: oldStatus } = payRowsFirst[0];
      if (oldStatus === 'created' && company_id && plan_id) {
        try {
          const [planRows] = await db.execute(`SELECT name, duration FROM subscription_plans WHERE id = ?`, [plan_id]);
          if (planRows && planRows.length > 0) {
            const plan = planRows[0];
            const duration = (plan.duration || 'monthly').toLowerCase();
            const interval = duration === 'yearly' ? '1 YEAR' : '1 MONTH';

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
          }
        } catch (subErr) {
          console.error('Error activating subscription after razorpay payment:', subErr);
        }
      }
    }

    // Return JSON to AJAX callers so frontend can handle routing reliably
    const isAjax = req.headers['content-type'] && String(req.headers['content-type']).includes('application/json');
    if (isAjax) {
      return res.json({ ok: true, paymentDetails, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
    }

    // Fallback for browser-based POSTs: redirect to success page
    const redirectBase = '/app/payments/success';
    const q = `?paymentId=${encodeURIComponent(razorpay_payment_id)}&orderId=${encodeURIComponent(razorpay_order_id)}`;
    return res.redirect(`${FRONTEND_URL}${redirectBase}${q}`);
  } catch (err) {
    console.error('confirm (razorpay) error', err);
    return res.redirect(`${FRONTEND_URL}/app/payments/failure`);
  }
});

// Handle browser GET redirects (keep for compatibility)
router.get('/confirm', (req, res) => {
  try {
    const { payment_id, order_id, error } = req.query || {};
    const s = error ? 'failure' : 'success';
    const q = [];
    if (payment_id) q.push(`paymentId=${encodeURIComponent(String(payment_id))}`);
    if (order_id) q.push(`orderId=${encodeURIComponent(String(order_id))}`);
    const qs = q.length ? `?${q.join('&')}` : '';
    if (s === 'success') return res.redirect(`${FRONTEND_URL}/app/payments/success${qs}`);
    return res.redirect(`${FRONTEND_URL}/app/payments/failure${qs}`);
  } catch (e) {
    console.error('confirm redirect error', e);
    return res.redirect(`${FRONTEND_URL}/app/payments/failure`);
  }
});

// Get payment status by orderId or razorpay_order_id
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const [rows] = await db.execute(`SELECT * FROM payments WHERE order_id = ? OR razorpay_order_id = ? LIMIT 1`, [orderId, orderId]);
    if (!rows || rows.length === 0) return res.status(404).json({});
    return res.json(rows[0]);
  } catch (err) {
    console.error('status error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Manual verify/sync endpoint by razorpay_payment_id
router.get('/verify-status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const [payRows] = await db.execute(
      `SELECT company_id, plan_id, status FROM payments WHERE razorpay_payment_id = ? LIMIT 1`,
      [paymentId]
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
