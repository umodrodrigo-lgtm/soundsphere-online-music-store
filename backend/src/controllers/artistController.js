const db  = require('../config/database');
const { generateId, paginate, paginatedResponse, slugify } = require('../utils/helpers');
const path = require('path');

// GET /api/artists
exports.getArtists = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const { search } = req.query;

    let where = [`ap.is_approved = TRUE`];
    let params = [];
    if (search) { where.push(`ap.stage_name LIKE ?`); params.push(`%${search}%`); }

    const whereClause = where.join(' AND ');

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM artist_profiles ap WHERE ${whereClause}`, params
    );
    const [artists] = await db.execute(
      `SELECT ap.id, ap.stage_name, ap.profile_image, ap.cover_image,
              ap.bio, ap.monthly_listeners, ap.total_plays, ap.is_verified,
              ap.country, g.name AS genre_name, g.color AS genre_color,
              (SELECT COUNT(*) FROM songs s WHERE s.artist_id = ap.id AND s.status = 'approved') AS song_count,
              (SELECT COUNT(*) FROM albums al WHERE al.artist_id = ap.id AND al.is_published = TRUE) AS album_count,
              (SELECT COUNT(*) FROM artist_followers af WHERE af.artist_id = ap.id) AS follower_count
       FROM artist_profiles ap
       LEFT JOIN genres g ON ap.genre_id = g.id
       WHERE ${whereClause}
       ORDER BY ap.monthly_listeners DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ success: true, ...paginatedResponse(artists, total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/artists/:id
exports.getArtist = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ap.*, u.email, u.created_at AS member_since,
              g.name AS genre_name, g.color AS genre_color,
              (SELECT COUNT(*) FROM artist_followers af WHERE af.artist_id = ap.id) AS follower_count
       FROM artist_profiles ap
       JOIN users u ON ap.user_id = u.id
       LEFT JOIN genres g ON ap.genre_id = g.id
       WHERE ap.id = ? AND ap.is_approved = TRUE`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Artist not found' });

    // songs
    const [songs] = await db.execute(
      `SELECT s.id, s.title, s.slug, s.duration, s.cover_image, s.audio_url,
              s.play_count, s.like_count, s.is_premium, s.release_date,
              g.name AS genre_name, g.color AS genre_color,
              al.title AS album_title
       FROM songs s
       LEFT JOIN genres g ON s.genre_id = g.id
       LEFT JOIN albums al ON s.album_id = al.id
       WHERE s.artist_id = ? AND s.status = 'approved' AND s.deleted_at IS NULL
       ORDER BY s.play_count DESC LIMIT 10`,
      [rows[0].id]
    );

    // albums
    const [albums] = await db.execute(
      `SELECT al.id, al.title, al.cover_image, al.release_date, al.album_type,
              (SELECT COUNT(*) FROM songs s WHERE s.album_id = al.id AND s.status = 'approved') AS track_count
       FROM albums al
       WHERE al.artist_id = ? AND al.is_published = TRUE
       ORDER BY al.release_date DESC`,
      [rows[0].id]
    );

    let following = false;
    if (req.user) {
      const [f] = await db.execute(
        'SELECT 1 FROM artist_followers WHERE user_id = ? AND artist_id = ?',
        [req.user.id, rows[0].id]
      );
      following = f.length > 0;
    }

    res.json({ success: true, data: { ...rows[0], songs, albums, following } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/artists/me/profile  (own profile)
exports.getMyProfile = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ap.*, g.name AS genre_name
       FROM artist_profiles ap
       LEFT JOIN genres g ON ap.genre_id = g.id
       WHERE ap.user_id = ?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/artists/me/profile
exports.updateProfile = async (req, res) => {
  try {
    const { stage_name, bio, genre_id, country, website, instagram, twitter, youtube, spotify_link } = req.body;
    const fields = [];
    const vals   = [];

    if (stage_name)   { fields.push('stage_name = ?');   vals.push(stage_name); }
    if (bio !== undefined) { fields.push('bio = ?');  vals.push(bio); }
    if (genre_id)     { fields.push('genre_id = ?');     vals.push(genre_id); }
    if (country)      { fields.push('country = ?');      vals.push(country); }
    if (website !== undefined)   { fields.push('website = ?');   vals.push(website); }
    if (instagram !== undefined) { fields.push('instagram = ?'); vals.push(instagram); }
    if (twitter !== undefined)   { fields.push('twitter = ?');   vals.push(twitter); }
    if (youtube !== undefined)   { fields.push('youtube = ?');   vals.push(youtube); }
    if (spotify_link !== undefined) { fields.push('spotify_link = ?'); vals.push(spotify_link); }

    if (req.files) {
      if (req.files.profile_image) fields.push('profile_image = ?'), vals.push(`/uploads/images/artists/${req.files.profile_image[0].filename}`);
      if (req.files.cover_image)   fields.push('cover_image = ?'),   vals.push(`/uploads/images/artists/${req.files.cover_image[0].filename}`);
    }

    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    vals.push(req.user.id);
    await db.execute(
      `UPDATE artist_profiles SET ${fields.join(', ')} WHERE user_id = ?`, vals
    );

    const [rows] = await db.execute(
      `SELECT ap.*, g.name AS genre_name FROM artist_profiles ap
       LEFT JOIN genres g ON ap.genre_id = g.id WHERE ap.user_id = ?`,
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/artists/songs  (upload song)
exports.uploadSong = async (req, res) => {
  try {
    const [ap] = await db.execute(
      'SELECT id FROM artist_profiles WHERE user_id = ? AND is_approved = TRUE', [req.user.id]
    );
    if (!ap.length) {
      return res.status(403).json({ success: false, message: 'Artist profile not approved yet' });
    }

    const { title, genre_id, duration, lyrics, release_date, album_id, is_premium = false } = req.body;

    if (!req.files || !req.files.audio) {
      return res.status(400).json({ success: false, message: 'Audio file is required' });
    }

    const id   = generateId();
    const slug = slugify(`${title}-${id.slice(0, 8)}`);
    const audioUrl = `/uploads/audio/${req.files.audio[0].filename}`;
    const coverUrl = req.files.cover ? `/uploads/images/albums/${req.files.cover[0].filename}` : null;

    await db.execute(
      `INSERT INTO songs (id, artist_id, album_id, genre_id, title, slug, duration, audio_url, cover_image, lyrics, release_date, is_premium)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, ap[0].id, album_id || null, genre_id || null, title, slug,
       parseInt(duration) || 0, audioUrl, coverUrl, lyrics || null, release_date || null,
       is_premium === 'true' || is_premium === true]
    );

    const [song] = await db.execute('SELECT * FROM songs WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: song[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/artists/songs  (own songs)
exports.getMySongs = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req);
    const [ap] = await db.execute('SELECT id FROM artist_profiles WHERE user_id = ?', [req.user.id]);
    if (!ap.length) return res.json({ success: true, data: [], pagination: {} });

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) AS total FROM songs WHERE artist_id = ? AND deleted_at IS NULL', [ap[0].id]
    );
    const [songs] = await db.execute(
      `SELECT s.*, g.name AS genre_name, al.title AS album_title
       FROM songs s
       LEFT JOIN genres g ON s.genre_id = g.id
       LEFT JOIN albums al ON s.album_id = al.id
       WHERE s.artist_id = ? AND s.deleted_at IS NULL
       ORDER BY s.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [ap[0].id]
    );
    res.json({ success: true, ...paginatedResponse(songs, total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/artists/songs/:id
exports.updateSong = async (req, res) => {
  try {
    const [ap] = await db.execute('SELECT id FROM artist_profiles WHERE user_id = ?', [req.user.id]);
    if (!ap.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    const [song] = await db.execute(
      'SELECT id FROM songs WHERE id = ? AND artist_id = ? AND deleted_at IS NULL',
      [req.params.id, ap[0].id]
    );
    if (!song.length) return res.status(404).json({ success: false, message: 'Song not found' });

    const { title, genre_id, lyrics, release_date, album_id, is_premium } = req.body;
    const fields = [];
    const vals   = [];

    if (title)        { fields.push('title = ?');        vals.push(title); }
    if (genre_id)     { fields.push('genre_id = ?');     vals.push(genre_id); }
    if (lyrics !== undefined)  { fields.push('lyrics = ?');  vals.push(lyrics); }
    if (release_date) { fields.push('release_date = ?'); vals.push(release_date); }
    if (album_id !== undefined) { fields.push('album_id = ?'); vals.push(album_id || null); }
    if (is_premium !== undefined) { fields.push('is_premium = ?'); vals.push(Boolean(is_premium)); }
    if (req.files && req.files.cover) {
      fields.push('cover_image = ?');
      vals.push(`/uploads/images/albums/${req.files.cover[0].filename}`);
    }

    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    // Reset status to pending on edit
    fields.push('status = ?'); vals.push('pending');
    vals.push(req.params.id);

    await db.execute(`UPDATE songs SET ${fields.join(', ')} WHERE id = ?`, vals);
    const [updated] = await db.execute('SELECT * FROM songs WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/artists/songs/:id
exports.deleteSong = async (req, res) => {
  try {
    const [ap] = await db.execute('SELECT id FROM artist_profiles WHERE user_id = ?', [req.user.id]);
    if (!ap.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    const result = await db.execute(
      'UPDATE songs SET deleted_at = NOW() WHERE id = ? AND artist_id = ? AND deleted_at IS NULL',
      [req.params.id, ap[0].id]
    );
    if (!result[0].affectedRows) return res.status(404).json({ success: false, message: 'Song not found' });
    res.json({ success: true, message: 'Song deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/artists/stats
exports.getStats = async (req, res) => {
  try {
    const [ap] = await db.execute('SELECT id FROM artist_profiles WHERE user_id = ?', [req.user.id]);
    if (!ap.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    const [[stats]] = await db.execute(
      `SELECT
         COUNT(*) AS total_songs,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_songs,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_songs,
         SUM(play_count) AS total_plays,
         SUM(like_count) AS total_likes
       FROM songs WHERE artist_id = ? AND deleted_at IS NULL`,
      [ap[0].id]
    );

    const [[{ followers }]] = await db.execute(
      'SELECT COUNT(*) AS followers FROM artist_followers WHERE artist_id = ?', [ap[0].id]
    );

    const [topSongs] = await db.execute(
      `SELECT id, title, cover_image, play_count, like_count
       FROM songs WHERE artist_id = ? AND deleted_at IS NULL
       ORDER BY play_count DESC LIMIT 5`,
      [ap[0].id]
    );

    const [albums] = await db.execute(
      `SELECT al.id, al.title, al.cover_image, al.release_date,
              COUNT(s.id) AS track_count
       FROM albums al
       LEFT JOIN songs s ON al.id = s.album_id AND s.deleted_at IS NULL
       WHERE al.artist_id = ?
       GROUP BY al.id ORDER BY al.release_date DESC`,
      [ap[0].id]
    );

    res.json({ success: true, data: { ...stats, followers, topSongs, albums } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/artists/:id/follow  (toggle)
exports.toggleFollow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [existing] = await db.execute(
      'SELECT 1 FROM artist_followers WHERE user_id = ? AND artist_id = ?', [userId, id]
    );
    if (existing.length) {
      await db.execute('DELETE FROM artist_followers WHERE user_id = ? AND artist_id = ?', [userId, id]);
      await db.execute('UPDATE artist_profiles SET monthly_listeners = GREATEST(0, monthly_listeners - 1) WHERE id = ?', [id]);
      return res.json({ success: true, following: false });
    } else {
      await db.execute('INSERT INTO artist_followers (user_id, artist_id) VALUES (?, ?)', [userId, id]);
      await db.execute('UPDATE artist_profiles SET monthly_listeners = monthly_listeners + 1 WHERE id = ?', [id]);
      return res.json({ success: true, following: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/artists/albums
exports.createAlbum = async (req, res) => {
  try {
    const [ap] = await db.execute('SELECT id FROM artist_profiles WHERE user_id = ?', [req.user.id]);
    if (!ap.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { title, description, genre_id, release_date, album_type = 'album' } = req.body;
    const id = generateId();
    const coverUrl = req.file ? `/uploads/images/albums/${req.file.filename}` : null;

    await db.execute(
      `INSERT INTO albums (id, artist_id, title, description, cover_image, genre_id, release_date, album_type, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [id, ap[0].id, title, description || null, coverUrl, genre_id || null, release_date || null, album_type]
    );

    const [album] = await db.execute('SELECT * FROM albums WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: album[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
