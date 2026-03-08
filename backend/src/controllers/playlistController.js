const db = require('../config/database');
const { generateId, paginate, paginatedResponse } = require('../utils/helpers');

// GET /api/playlists
exports.getMyPlaylists = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) AS total FROM playlists WHERE user_id = ? AND deleted_at IS NULL',
      [req.user.id]
    );
    const [playlists] = await db.execute(
      `SELECT p.*,
              (SELECT COUNT(*) FROM playlist_songs ps WHERE ps.playlist_id = p.id) AS song_count
       FROM playlists p
       WHERE p.user_id = ? AND p.deleted_at IS NULL
       ORDER BY p.updated_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [req.user.id]
    );
    res.json({ success: true, ...paginatedResponse(playlists, total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/playlists/public
exports.getPublicPlaylists = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) AS total FROM playlists WHERE is_public = TRUE AND deleted_at IS NULL'
    );
    const [playlists] = await db.execute(
      `SELECT p.*, u.username, u.display_name, u.avatar_url,
              (SELECT COUNT(*) FROM playlist_songs ps WHERE ps.playlist_id = p.id) AS song_count
       FROM playlists p
       JOIN users u ON p.user_id = u.id
       WHERE p.is_public = TRUE AND p.deleted_at IS NULL
       ORDER BY p.updated_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    );
    res.json({ success: true, ...paginatedResponse(playlists, total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/playlists
exports.createPlaylist = async (req, res) => {
  try {
    const { title, description, is_public = true } = req.body;
    const id = generateId();
    const coverUrl = req.file ? `/uploads/images/albums/${req.file.filename}` : null;

    await db.execute(
      'INSERT INTO playlists (id, user_id, title, description, cover_image, is_public) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.user.id, title, description || null, coverUrl, is_public]
    );
    const [pl] = await db.execute('SELECT * FROM playlists WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: pl[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/playlists/:id
exports.getPlaylist = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, u.username, u.display_name, u.avatar_url
       FROM playlists p JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.deleted_at IS NULL
         AND (p.is_public = TRUE OR p.user_id = ?)`,
      [req.params.id, req.user?.id || '']
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Playlist not found' });

    const [songs] = await db.execute(
      `SELECT s.id, s.title, s.slug, s.duration, s.cover_image, s.audio_url,
              s.play_count, s.like_count, s.is_premium,
              ps.position, ps.added_at,
              a.id AS artist_id, a.stage_name AS artist_name,
              g.name AS genre_name
       FROM playlist_songs ps
       JOIN songs s ON ps.song_id = s.id
       JOIN artist_profiles a ON s.artist_id = a.id
       LEFT JOIN genres g ON s.genre_id = g.id
       WHERE ps.playlist_id = ? AND s.deleted_at IS NULL
       ORDER BY ps.position ASC, ps.added_at ASC`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], songs } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/playlists/:id
exports.updatePlaylist = async (req, res) => {
  try {
    const { title, description, is_public } = req.body;
    const [pl] = await db.execute(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [req.params.id, req.user.id]
    );
    if (!pl.length) return res.status(404).json({ success: false, message: 'Playlist not found' });

    const fields = [];
    const vals   = [];
    if (title !== undefined)     { fields.push('title = ?');     vals.push(title); }
    if (description !== undefined) { fields.push('description = ?'); vals.push(description); }
    if (is_public !== undefined) { fields.push('is_public = ?'); vals.push(Boolean(is_public)); }
    if (req.file) { fields.push('cover_image = ?'); vals.push(`/uploads/images/albums/${req.file.filename}`); }

    if (fields.length) {
      vals.push(req.params.id);
      await db.execute(`UPDATE playlists SET ${fields.join(', ')} WHERE id = ?`, vals);
    }

    const [updated] = await db.execute('SELECT * FROM playlists WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/playlists/:id
exports.deletePlaylist = async (req, res) => {
  try {
    const result = await db.execute(
      'UPDATE playlists SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [req.params.id, req.user.id]
    );
    if (!result[0].affectedRows) return res.status(404).json({ success: false, message: 'Playlist not found' });
    res.json({ success: true, message: 'Playlist deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/playlists/:id/songs
exports.addSong = async (req, res) => {
  try {
    const { song_id } = req.body;
    const [pl] = await db.execute(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [req.params.id, req.user.id]
    );
    if (!pl.length) return res.status(404).json({ success: false, message: 'Playlist not found' });

    const [[{ maxPos }]] = await db.execute(
      'SELECT COALESCE(MAX(position), 0) AS maxPos FROM playlist_songs WHERE playlist_id = ?',
      [req.params.id]
    );

    await db.execute(
      'INSERT IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)',
      [req.params.id, song_id, maxPos + 1]
    );
    await db.execute('UPDATE playlists SET updated_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Song added to playlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/playlists/:id/songs/:songId
exports.removeSong = async (req, res) => {
  try {
    const [pl] = await db.execute(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [req.params.id, req.user.id]
    );
    if (!pl.length) return res.status(404).json({ success: false, message: 'Playlist not found' });
    await db.execute(
      'DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
      [req.params.id, req.params.songId]
    );
    res.json({ success: true, message: 'Song removed from playlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
