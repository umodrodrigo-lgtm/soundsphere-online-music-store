const jwt = require('jsonwebtoken');
const db  = require('../config/database');

/**
 * Verify JWT and attach user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.execute(
      `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url,
              u.is_active, u.role_id, r.name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.is_active = TRUE AND u.deleted_at IS NULL`,
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Optional auth – attaches user if token present, continues either way
 */
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await db.execute(
        `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url,
                u.is_active, u.role_id, r.name AS role
         FROM users u JOIN roles r ON u.role_id = r.id
         WHERE u.id = ? AND u.is_active = TRUE AND u.deleted_at IS NULL`,
        [decoded.id]
      );
      if (rows.length) req.user = rows[0];
    }
  } catch (_) { /* ignore */ }
  next();
};

/**
 * Authorize by role name(s)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, optionalAuth, authorize };
