const router = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('username').isAlphanumeric('en-US', { ignore: '_' }).isLength({ min: 3, max: 30 }),
  body('role').optional().isIn(['customer', 'artist']),
  validate,
  ctrl.register
);

router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  validate,
  ctrl.login
);

router.get('/me', authenticate, ctrl.getMe);

router.post('/forgot-password',
  body('email').isEmail(),
  validate,
  ctrl.forgotPassword
);

router.post('/reset-password',
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
  validate,
  ctrl.resetPassword
);

module.exports = router;
