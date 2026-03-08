const router = require('express').Router();
const ctrl   = require('../controllers/songController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/',          optionalAuth, ctrl.getSongs);
router.get('/trending',  ctrl.getTrending);
router.get('/latest',    ctrl.getLatest);
router.get('/liked',     authenticate, ctrl.getLikedSongs);
router.get('/:id',       optionalAuth, ctrl.getSong);
router.post('/:id/play', optionalAuth, ctrl.recordPlay);
router.post('/:id/like', authenticate, ctrl.toggleLike);

module.exports = router;
