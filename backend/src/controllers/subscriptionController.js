const db = require('../config/database');
const { generateId } = require('../utils/helpers');

// GET /api/subscription-plans
exports.getPlans = async (req, res) => {
  try {
    const [plans] = await db.execute(
      'SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price ASC'
    );
    res.json({ success: true, data: plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/subscriptions/me
exports.getMySubscription = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, sp.name AS plan_name, sp.price, sp.billing_cycle,
              sp.is_premium, sp.has_ads, sp.audio_quality, sp.features,
              sp.max_accounts
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = ? AND s.status = 'active'
       ORDER BY s.created_at DESC LIMIT 1`,
      [req.user.id]
    );
    const [history] = await db.execute(
      `SELECT s.id, s.status, s.started_at, s.expires_at, s.cancelled_at, s.created_at,
              sp.name AS plan_name, sp.price, sp.billing_cycle
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC LIMIT 10`,
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] || null, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/subscriptions/subscribe  (simulated payment)
exports.subscribe = async (req, res) => {
  try {
    const { plan_id, payment_method = 'simulated_card' } = req.body;

    const [plans] = await db.execute(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE', [plan_id]
    );
    if (!plans.length) return res.status(404).json({ success: false, message: 'Plan not found' });

    const plan = plans[0];

    // Cancel existing active subscription
    await db.execute(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW()
       WHERE user_id = ? AND status = 'active'`,
      [req.user.id]
    );

    const subId = generateId();
    const payId = generateId();
    const now   = new Date();
    let expiresAt = null;

    if (plan.billing_cycle === 'monthly') {
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan.billing_cycle === 'yearly') {
      expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Simulate payment success
    await db.execute(
      `INSERT INTO payments (id, user_id, amount, currency, status, payment_method, transaction_ref, paid_at)
       VALUES (?, ?, ?, 'USD', 'completed', ?, ?, NOW())`,
      [payId, req.user.id, plan.price, payment_method, `TXN-${Date.now()}`]
    );

    await db.execute(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, started_at, expires_at)
       VALUES (?, ?, ?, 'active', NOW(), ?)`,
      [subId, req.user.id, plan_id, expiresAt]
    );

    // Link payment to subscription
    await db.execute('UPDATE payments SET subscription_id = ? WHERE id = ?', [subId, payId]);

    const [sub] = await db.execute(
      `SELECT s.*, sp.name AS plan_name, sp.is_premium, sp.has_ads, sp.audio_quality, sp.features
       FROM subscriptions s JOIN subscription_plans sp ON s.plan_id = sp.id WHERE s.id = ?`,
      [subId]
    );

    res.status(201).json({ success: true, message: 'Subscription activated', data: sub[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/subscriptions/cancel
exports.cancelSubscription = async (req, res) => {
  try {
    const result = await db.execute(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW(), auto_renew = FALSE
       WHERE user_id = ? AND status = 'active'`,
      [req.user.id]
    );
    if (!result[0].affectedRows) {
      return res.status(404).json({ success: false, message: 'No active subscription found' });
    }
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
