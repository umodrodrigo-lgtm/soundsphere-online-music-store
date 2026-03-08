const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const adminOnly = [authenticate, authorize('admin')];

router.get('/dashboard',             ...adminOnly, ctrl.getDashboard);
router.get('/users',                 ...adminOnly, ctrl.getUsers);
router.put('/users/:id',             ...adminOnly, ctrl.updateUser);
router.get('/songs',                 ...adminOnly, ctrl.getSongs);
router.put('/songs/:id/approve',     ...adminOnly, ctrl.approveSong);
router.delete('/songs/:id',          ...adminOnly, ctrl.deleteSong);
router.get('/artists',               ...adminOnly, ctrl.getArtists);
router.put('/artists/:id',           ...adminOnly, ctrl.updateArtist);
router.get('/subscriptions',         ...adminOnly, ctrl.getSubscriptions);
router.get('/plans',                 ...adminOnly, ctrl.getPlans);
router.post('/plans',                ...adminOnly, ctrl.createPlan);
router.put('/plans/:id',             ...adminOnly, ctrl.updatePlan);
router.get('/genres',                ...adminOnly, ctrl.getGenres);

module.exports = router;
