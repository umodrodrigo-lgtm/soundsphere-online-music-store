const db = require('../config/database');
const { paginate, paginatedResponse, generateId } = require('../utils/helpers');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [[users]]   = await db.execute('SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL');
    const [[artists]] = await db.execute('SELECT COUNT(*) AS total FROM artist_profiles');
    const [[songs]]   = await db.execute("SELECT COUNT(*) AS total FROM songs WHERE deleted_at IS NULL AND status = 'approved'");
    const [[pending]] = await db.execute("SELECT COUNT(*) AS total FROM songs WHERE deleted_at IS NULL AND status = 'pending'");
    const [[subs]]    = await db.execute("SELECT COUNT(*) AS total FROM subscriptions WHERE status = 'active'");
    const [[revenue]] = await db.execute("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed'");

    // Monthly signups (last 6 months)
    const [monthlySignups] = await db.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month ASC`
    );

    // Top songs
    const [topSongs] = await db.execute(
      `SELECT s.id, s.title, s.play_count, a.stage_name AS artist_name
       FROM songs s JOIN artist_profiles a ON s.artist_id = a.id
       WHERE s.status = 'approved' AND s.deleted_at IS NULL
       ORDER BY s.play_count DESC LIMIT 5`
    );

    // Genre distribution
    const [genreStats] = await db.execute(
      `SELECT g.name, COUNT(s.id) AS count
       FROM songs s LEFT JOIN genres g ON s.genre_id = g.id
       WHERE s.status = 'approved' AND s.deleted_at IS NULL
       GROUP BY g.id ORDER BY count DESC LIMIT 8`
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers:    users.total,
          totalArtists:  artists.total,
          totalSongs:    songs.total,
          pendingSongs:  pending.total,
          activeSubscriptions: subs.total,
          totalRevenue:  parseFloat(revenue.total),
        },
        monthlySignups,
        topSongs,
        genreStats,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const { search, role } = req.query;

    let where = ['u.deleted_at IS NULL'];
    let params = [];
    if (search) { where.push('(u.email LIKE ? OR u.username LIKE ? OR u.display_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (role)   { where.push('r.name = ?'); params.push(role); }

    const whereClause = where.join(' AND ');
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM users u JOIN roles r ON u.role_id = r.id WHERE ${whereClause}`, params
    );
    const [users] = await db.execute(
      `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, u.is_active,
              u.email_verified, u.created_at, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ success: true, ...paginatedResponse(users, total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { is_active, email_verified } = req.body;
    const fields = [];
    const vals   = [];
    if (is_active !== undefined)      { fields.push('is_active = ?');      vals.push(Boolean(is_active)); }
    if (email_verified !== undefined) { fields.push('email_verified = ?'); vals.push(Boolean(email_verified)); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'No updates provided' });
    vals.push(req.params.id);
    await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);

    // Log admin action
    await db.execute(
      'INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), req.user.id, 'update_user', 'user', req.params.id, JSON.stringify(req.body)]
    );
    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/songs
exports.getSongs = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const { status, search } = req.query;

    let where = ['s.deleted_at IS NULL'];
    let params = [];
    if (status) { where.push('s.status = ?'); params.push(status); }
    if (search) { where.push('(s.title LIKE ? OR a.stage_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const whereClause = where.join(' AND ');
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM songs s
       JOIN artist_profiles a ON s.artist_id = a.id
       WHERE ${whereClause}`, params
    );
    const [songs] = await db.execute(
      `SELECT s.id, s.title, s.slug, s.status, s.play_count, s.like_count,
              s.is_premium, s.cover_image, s.created_at,
              a.stage_name AS artist_name, a.id AS artist_id,
              g.name AS genre_name
       FROM songs s
       JOIN artist_profiles a ON s.artist_id = a.id
       LEFT JOIN genres g     ON s.genre_id  = g.id
       WHERE ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ success: true, ...paginatedResponse(songs, total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/songs/:id/approve
exports.approveSong = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await db.execute('UPDATE songs SET status = ? WHERE id = ? AND deleted_at IS NULL', [status, req.params.id]);
    await db.execute(
      'INSERT INTO admin_logs (id, admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)',
      [generateId(), req.user.id, `song_${status}`, 'song', req.params.id]
    );
    res.json({ success: true, message: `Song ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/admin/songs/:id
exports.deleteSong = async (req, res) => {
  try {
    await db.execute('UPDATE songs SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await db.execute(
      'INSERT INTO admin_logs (id, admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)',
      [generateId(), req.user.id, 'delete_song', 'song', req.params.id]
    );
    res.json({ success: true, message: 'Song deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/artists
exports.getArtists = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const { search, approved } = req.query;

    let where = [];
    let params = [];
    if (approved !== undefined) { where.push('ap.is_approved = ?'); params.push(approved === 'true'); }
    if (search)                 { where.push('ap.stage_name LIKE ?'); params.push(`%${search}%`); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM artist_profiles ap ${whereClause}`, params
    );
    const [artists] = await db.execute(
      `SELECT ap.id, ap.stage_name, ap.profile_image, ap.is_verified, ap.is_approved,
              ap.monthly_listeners, ap.total_plays, ap.created_at,
              u.email, u.username,
              (SELECT COUNT(*) FROM songs s WHERE s.artist_id = ap.id AND s.deleted_at IS NULL) AS song_count
       FROM artist_profiles ap
       JOIN users u ON ap.user_id = u.id
       ${whereClause}
       ORDER BY ap.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ success: true, ...paginatedResponse(artists, total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/artists/:id
exports.updateArtist = async (req, res) => {
  try {
    const { is_approved, is_verified } = req.body;
    const fields = [];
    const vals   = [];
    if (is_approved !== undefined) { fields.push('is_approved = ?'); vals.push(Boolean(is_approved)); }
    if (is_verified !== undefined) { fields.push('is_verified = ?'); vals.push(Boolean(is_verified)); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'No updates provided' });
    vals.push(req.params.id);
    await db.execute(`UPDATE artist_profiles SET ${fields.join(', ')} WHERE id = ?`, vals);
    res.json({ success: true, message: 'Artist updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const [[{ total }]] = await db.execute('SELECT COUNT(*) AS total FROM subscriptions');
    const [subs] = await db.execute(
      `SELECT s.*, u.email, u.username, sp.name AS plan_name, sp.price
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       JOIN subscription_plans sp ON s.plan_id = sp.id
       ORDER BY s.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    );
    res.json({ success: true, ...paginatedResponse(subs, total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/plans
exports.getPlans = async (req, res) => {
  try {
    const [plans] = await db.execute('SELECT * FROM subscription_plans ORDER BY price ASC');
    res.json({ success: true, data: plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/plans
exports.createPlan = async (req, res) => {
  try {
    const { name, slug, price, billing_cycle, max_accounts, has_ads, is_premium, audio_quality, features } = req.body;
    const [result] = await db.execute(
      `INSERT INTO subscription_plans (name, slug, price, billing_cycle, max_accounts, has_ads, is_premium, audio_quality, features)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, price, billing_cycle, max_accounts || 1, Boolean(has_ads), Boolean(is_premium), audio_quality || 'standard', JSON.stringify(features || [])]
    );
    const [plan] = await db.execute('SELECT * FROM subscription_plans WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: plan[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/plans/:id
exports.updatePlan = async (req, res) => {
  try {
    const { name, price, is_active, features } = req.body;
    const fields = [];
    const vals   = [];
    if (name !== undefined)      { fields.push('name = ?');      vals.push(name); }
    if (price !== undefined)     { fields.push('price = ?');     vals.push(price); }
    if (is_active !== undefined) { fields.push('is_active = ?'); vals.push(Boolean(is_active)); }
    if (features !== undefined)  { fields.push('features = ?');  vals.push(JSON.stringify(features)); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'No updates' });
    vals.push(req.params.id);
    await db.execute(`UPDATE subscription_plans SET ${fields.join(', ')} WHERE id = ?`, vals);
    const [plan] = await db.execute('SELECT * FROM subscription_plans WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: plan[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/genres
exports.getGenres = async (req, res) => {
  try {
    const [genres] = await db.execute(
      `SELECT g.*, COUNT(s.id) AS song_count
       FROM genres g
       LEFT JOIN songs s ON g.id = s.genre_id AND s.deleted_at IS NULL
       GROUP BY g.id ORDER BY g.name ASC`
    );
    res.json({ success: true, data: genres });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
