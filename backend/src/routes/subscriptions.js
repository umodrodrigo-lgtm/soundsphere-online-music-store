const router = require('express').Router();
const ctrl   = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

router.get('/plans',   ctrl.getPlans);
router.get('/me',      authenticate, ctrl.getMySubscription);
router.post('/subscribe', authenticate, ctrl.subscribe);
router.post('/cancel',    authenticate, ctrl.cancelSubscription);

module.exports = router;
