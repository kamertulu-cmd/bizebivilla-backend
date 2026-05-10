// ── inquiry.routes.js ─────────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/inquiry.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/',              ctrl.createInquiry);          // misafir gönderir
router.get('/mine',           protect, ctrl.getMyInquiries);// villa sahibi görür
router.put('/:id/status',     protect, ctrl.updateInquiryStatus);

module.exports = router;
