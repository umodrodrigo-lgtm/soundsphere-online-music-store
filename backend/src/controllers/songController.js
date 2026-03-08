const db = require('../config/database');
const { generateId, paginate, paginatedResponse } = require('../utils/helpers');
const path = require('path');

// GET /api/songs
exports.getSongs = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const { genre, search, status = 'approved' } = req.query;

    let where = [`s.status = ?`, `s.deleted_at IS NULL`];
    let params = [status];

    if (genre) { where.push(`g.slug = ?`); params.push(genre); }
    if (search) {
      where.push(`(s.title LIKE ? OR a.stage_name LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = where.join(' AND ');

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM songs s
       JOIN artist_profiles a ON s.artist_id = a.id
       LEFT JOIN genres g ON s.genre_id = g.id
       WHERE ${whereClause}`,
      params
    );

    const [songs] = await db.execute(
      `SELECT s.id, s.title, s.slug, s.duration, s.cover_image, s.audio_url,
              s.play_count, s.like_count, s.is_premium, s.status, s.release_date,
              a.id AS artist_id, a.stage_name AS artist_name, a.profile_image AS artist_image,
              al.id AS album_id, al.title AS album_title,
              g.id AS genre_id, g.name AS genre_name, g.color AS genre_color
       FROM songs s
       JOIN artist_profiles a ON s.artist_id = a.id
       LEFT JOIN albums al   ON s.album_id  = al.id
       LEFT JOIN genres g    ON s.genre_id  = g.id
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

// GET /api/songs/trending
exports.getTrending = async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const [songs] = await db.execute(
      `SELECT s.id, s.title, s.slug, s.duration, s.cover_image, s.audio_url,
              s.play_count, s.like_count, s.is_premium,
              a.id AS artist_id, a.stage_name AS artist_name, a.profile_image AS artist_image,
              g.name AS genre_name, g.color AS genre_color
       FROM songs s
       JOIN artist_profiles a ON s.artist_id = a.id
       LEFT JOIN genres g     ON s.genre_id  = g.id
       WHERE s.status = 'approved' AND s.deleted_at IS NULL
       ORDER BY s.play_count DESC LIMIT ${limit}`
    );
    res.json({ success: true, data: songs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/songs/latest
exports.getLatest = async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const [songs] = await db.execute(
      `SELECT s.id, s.title, s.slug, s.duration, s.cover_image, s.audio_url,
              s.play_count, s.like_count, s.is_premium,
              a.id AS artist_id, a.stage_name AS artist_name, a.profile_image AS artist_image,
              g.name AS genre_name, g.color AS genre_color
       FROM songs s
       JOIN artist_profiles a ON s.artist_id = a.id
       LEFT JOIN genres g     ON s.genre_id  = g.id
       WHERE s.status = 'approved' AND s.deleted_at IS NULL
       ORDER BY s.release_date DESC, s.created_at DESC LIMIT ${limit}`
    );
    res.json({ success: true, data: songs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/songs/:id
exports.getSong = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, a.id AS artist_id, a.stage_name AS artist_name,
              a.profile_image AS artist_image, a.is_verified,
              al.title AS album_title, al.cover_image AS album_cover,
              g.name AS genre_name, g.color AS genre_color
       FROM songs s
       JOIN artist_profiles a ON s.artist_id = a.id
       LEFT JOIN albums al    ON s.album_id  = al.id
       LEFT JOIN genres g     ON s.genre_id  = g.id
       WHERE (s.id = ? OR s.slug = ?) AND s.deleted_at IS NULL`,
      [req.params.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Song not found' });

    let liked = false;
    if (req.user) {
      const [lk] = await db.execute(
        'SELECT 1 FROM song_likes WHERE user_id = ? AND song_id = ?',
        [req.user.id, rows[0].id]
      );
      liked = lk.length > 0;
    }

    res.json({ success: true, data: { ...rows[0], liked } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/songs/:id/play  (increment play count + history)
exports.recordPlay = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('UPDATE songs SET play_count = play_count + 1 WHERE id = ?', [id]);

    if (req.user) {
      await db.execute(
        'INSERT INTO listening_history (user_id, song_id, duration_s) VALUES (?, ?, ?)',
        [req.user.id, id, req.body.duration_s || 0]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/songs/:id/like  (toggle)
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [existing] = await db.execute(
      'SELECT 1 FROM song_likes WHERE user_id = ? AND song_id = ?', [userId, id]
    );

    if (existing.length) {
      await db.execute('DELETE FROM song_likes WHERE user_id = ? AND song_id = ?', [userId, id]);
      await db.execute('UPDATE songs SET like_count = GREATEST(0, like_count - 1) WHERE id = ?', [id]);
      return res.json({ success: true, liked: false });
    } else {
      await db.execute('INSERT INTO song_likes (user_id, song_id) VALUES (?, ?)', [userId, id]);
      await db.execute('UPDATE songs SET like_count = like_count + 1 WHERE id = ?', [id]);
      return res.json({ success: true, liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/songs/liked  (user's liked songs)
exports.getLikedSongs = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) AS total FROM song_likes WHERE user_id = ?', [req.user.id]
    );
    const [songs] = await db.execute(
      `SELECT s.id, s.title, s.slug, s.duration, s.cover_image, s.audio_url,
              s.play_count, s.like_count, s.is_premium, sl.created_at AS liked_at,
              a.id AS artist_id, a.stage_name AS artist_name,
              g.name AS genre_name, g.color AS genre_color
       FROM song_likes sl
       JOIN songs s ON sl.song_id = s.id
       JOIN artist_profiles a ON s.artist_id = a.id
       LEFT JOIN genres g ON s.genre_id = g.id
       WHERE sl.user_id = ? AND s.deleted_at IS NULL
       ORDER BY sl.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [req.user.id]
    );
    res.json({ success: true, ...paginatedResponse(songs, total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
