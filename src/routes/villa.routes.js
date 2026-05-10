const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/villa.controller');
const { protect } = require('../middleware/auth.middleware');

// Herkese açık
router.get('/',          ctrl.getAllVillas);
router.get('/featured',  ctrl.getFeaturedVillas);
router.get('/stats',     ctrl.getStats);
router.get('/my',        protect, ctrl.getMyVillas);
router.get('/:slug',     ctrl.getVillaBySlug);

// Kimlik doğrulama gerekli
router.post('/',         protect, ctrl.createVilla);
router.put('/:id',       protect, ctrl.updateVilla);
router.delete('/:id',    protect, ctrl.deleteVilla);

module.exports = router;
