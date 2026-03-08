const router = require('express').Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [genres] = await db.execute(
      `SELECT g.id, g.name, g.slug, g.color, g.icon,
              COUNT(s.id) AS song_count
       FROM genres g
       LEFT JOIN songs s ON g.id = s.genre_id AND s.status = 'approved' AND s.deleted_at IS NULL
       GROUP BY g.id
       ORDER BY song_count DESC`
    );
    res.json({ success: true, data: genres });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
