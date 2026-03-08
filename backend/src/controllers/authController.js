const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db     = require('../config/database');

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { email, password, username, display_name, role = 'customer' } = req.body;

    // Check duplicate
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?', [email, username]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email or username already in use' });
    }

    // Role lookup
    const [roleRows] = await db.execute(
      "SELECT id FROM roles WHERE name = ? AND name IN ('customer','artist')", [role]
    );
    if (!roleRows.length) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const hash = await bcrypt.hash(password, 12);
    const id   = uuidv4();

    await db.execute(
      `INSERT INTO users (id, role_id, email, password_hash, username, display_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, roleRows[0].id, email, hash, username, display_name || username]
    );

    // If artist, create empty profile
    if (role === 'artist') {
      const apId = uuidv4();
      await db.execute(
        'INSERT INTO artist_profiles (id, user_id, stage_name) VALUES (?, ?, ?)',
        [apId, id, display_name || username]
      );
    }

    const token = signToken(id, role);
    const [user] = await db.execute(
      `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url,
              u.role_id, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [id]
    );

    res.status(201).json({ success: true, message: 'Account created successfully', token, user: user[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.execute(
      `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url,
              u.password_hash, u.is_active, u.role_id, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.deleted_at IS NULL`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Get artist profile id if artist
    let artistProfile = null;
    if (user.role === 'artist') {
      const [ap] = await db.execute(
        'SELECT id, stage_name, profile_image, is_approved FROM artist_profiles WHERE user_id = ?',
        [user.id]
      );
      artistProfile = ap[0] || null;
    }

    const token = signToken(user.id, user.role);
    const { password_hash, ...safeUser } = user;

    res.json({ success: true, token, user: { ...safeUser, artistProfile } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url,
              u.bio, u.country, u.email_verified, u.created_at,
              u.role_id, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    let artistProfile = null;
    if (req.user.role === 'artist') {
      const [ap] = await db.execute(
        `SELECT ap.*, g.name AS genre_name
         FROM artist_profiles ap
         LEFT JOIN genres g ON ap.genre_id = g.id
         WHERE ap.user_id = ?`,
        [req.user.id]
      );
      artistProfile = ap[0] || null;
    }

    let subscription = null;
    if (req.user.role === 'customer') {
      const [sub] = await db.execute(
        `SELECT s.*, sp.name AS plan_name, sp.is_premium, sp.has_ads, sp.audio_quality
         FROM subscriptions s
         JOIN subscription_plans sp ON s.plan_id = sp.id
         WHERE s.user_id = ? AND s.status = 'active'
         ORDER BY s.created_at DESC LIMIT 1`,
        [req.user.id]
      );
      subscription = sub[0] || null;
    }

    res.json({ success: true, user: { ...rows[0], artistProfile, subscription } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    // Always return success to prevent email enumeration
    if (rows.length) {
      const token  = require('crypto').randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 3600000); // 1 hour
      await db.execute(
        'UPDATE users SET reset_token = ?, reset_token_exp = ? WHERE id = ?',
        [token, expiry, rows[0].id]
      );
      // In production: send email with reset link
      console.log(`Password reset token for ${email}: ${token}`);
    }
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const [rows] = await db.execute(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_exp > NOW()',
      [token]
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    const hash = await bcrypt.hash(password, 12);
    await db.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_exp = NULL WHERE id = ?',
      [hash, rows[0].id]
    );
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
