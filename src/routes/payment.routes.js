// src/routes/payment.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/payment.controller');

// ── Ödeme başlatma ──────────────────────────────────────────────
// Frontend: ödeme formu doldurulduktan sonra kartla birlikte buraya POST
router.post('/init', ctrl.initPayment);

// ── Param 3DS callback ──────────────────────────────────────────
// Param hem POST hem GET ile gelebilir, ikisini de aç
router.post('/callback', ctrl.handleCallback);
router.get('/callback',  ctrl.handleCallback);

// ── Ödeme durumu sorgu ──────────────────────────────────────────
router.get('/status/:inquiryId', ctrl.getPaymentStatus);

module.exports = router;
