const router = require('express').Router();
const ctrl   = require('../controllers/playlistController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.get('/public',    ctrl.getPublicPlaylists);
router.get('/',          authenticate, ctrl.getMyPlaylists);
router.post('/',         authenticate, uploadImage('albums').single('cover'), ctrl.createPlaylist);
router.get('/:id',       optionalAuth, ctrl.getPlaylist);
router.put('/:id',       authenticate, uploadImage('albums').single('cover'), ctrl.updatePlaylist);
router.delete('/:id',    authenticate, ctrl.deletePlaylist);
router.post('/:id/songs',         authenticate, ctrl.addSong);
router.delete('/:id/songs/:songId', authenticate, ctrl.removeSong);

module.exports = router;
