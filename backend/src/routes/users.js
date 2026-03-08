const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.put('/me',          authenticate, uploadImage('avatars').single('avatar'), ctrl.updateProfile);
router.put('/me/password', authenticate, ctrl.changePassword);
router.get('/me/history',  authenticate, ctrl.getHistory);
router.get('/me/notifications', authenticate, ctrl.getNotifications);

module.exports = router;
