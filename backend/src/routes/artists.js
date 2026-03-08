const router = require('express').Router();
const ctrl   = require('../controllers/artistController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { uploadImage, uploadSong } = require('../middleware/upload');

// Artist-only (must come before /:id to avoid conflict)
router.get('/me/profile', authenticate, authorize('artist'), ctrl.getMyProfile);
router.put('/me/profile', authenticate, authorize('artist'),
  uploadImage('artists').fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'cover_image',   maxCount: 1 },
  ]),
  ctrl.updateProfile
);

router.get('/me/songs',    authenticate, authorize('artist'), ctrl.getMySongs);
router.post('/me/songs',   authenticate, authorize('artist'),
  uploadSong().fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  ctrl.uploadSong
);
router.put('/me/songs/:id', authenticate, authorize('artist'),
  uploadSong().fields([{ name: 'cover', maxCount: 1 }]),
  ctrl.updateSong
);
router.delete('/me/songs/:id', authenticate, authorize('artist'), ctrl.deleteSong);

router.get('/me/stats', authenticate, authorize('artist'), ctrl.getStats);

router.post('/me/albums', authenticate, authorize('artist'),
  uploadImage('albums').single('cover'),
  ctrl.createAlbum
);

// Public (after /me/... to avoid /:id swallowing "me")
router.get('/', ctrl.getArtists);
router.get('/:id', optionalAuth, ctrl.getArtist);
router.post('/:id/follow', authenticate, ctrl.toggleFollow);

module.exports = router;
