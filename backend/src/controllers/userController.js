const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { paginate, paginatedResponse } = require('../utils/helpers');

// PUT /api/users/me
exports.updateProfile = async (req, res) => {
  try {
    const { display_name, bio, country, username } = req.body;
    const fields = [];
    const vals   = [];

    if (display_name !== undefined) { fields.push('display_name = ?'); vals.push(display_name); }
    if (bio !== undefined)          { fields.push('bio = ?');          vals.push(bio); }
    if (country !== undefined)      { fields.push('country = ?');      vals.push(country); }
    if (username) {
      // Check uniqueness
      const [ex] = await db.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]
      );
      if (ex.length) return res.status(409).json({ success: false, message: 'Username already taken' });
      fields.push('username = ?');
      vals.push(username);
    }
    if (req.file) {
      fields.push('avatar_url = ?');
      vals.push(`/uploads/images/avatars/${req.file.filename}`);
    }

    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });
    vals.push(req.user.id);
    await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);

    const [rows] = await db.execute(
      `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url,
              u.bio, u.country, u.role_id, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/users/me/password
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/me/history
exports.getHistory = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) AS total FROM listening_history WHERE user_id = ?', [req.user.id]
    );
    const [history] = await db.execute(
      `SELECT lh.id, lh.played_at, lh.duration_s,
              s.id AS song_id, s.title, s.cover_image, s.duration, s.slug,
              a.stage_name AS artist_name, a.id AS artist_id
       FROM listening_history lh
       JOIN songs s ON lh.song_id = s.id
       JOIN artist_profiles a ON s.artist_id = a.id
       WHERE lh.user_id = ?
       ORDER BY lh.played_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [req.user.id]
    );
    res.json({ success: true, ...paginatedResponse(history, total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/me/notifications
exports.getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [req.user.id]);
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
