const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

app.set('trust proxy', 1);  // Railway proxy arkasında — gerçek IP'yi al

// ── Güvenlik başlıkları ───────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
}));

// ── Rate limiting ─────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100,
  message: { success: false, message: 'Çok fazla istek gönderildi, lütfen bekleyin.' },
});
app.use('/api', limiter);

// Auth rotaları için daha sıkı limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Çok fazla giriş denemesi yapıldı.' },
});

// ── Body parser ───────────────────────────────────────────────────
// NOT: Param callback'i application/x-www-form-urlencoded olarak gelir
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Loglama ───────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Statik dosyalar (yüklenen görseller) ─────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rotalar ───────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth.routes');
const villaRoutes       = require('./routes/villa.routes');
const inquiryRoutes     = require('./routes/inquiry.routes');
const regionRoutes      = require('./routes/region.routes');
const uploadRoutes      = require('./routes/upload.routes');
const ownerRoutes       = require('./routes/owner.routes');
const availabilityRoutes= require('./routes/availability.routes');
const competitorRoutes  = require('./routes/competitor.routes');
const reviewRoutes      = require('./routes/review.routes');
const aiRoutes          = require('./routes/ai.routes');
const paymentRoutes     = require('./routes/payment.routes');

app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/villas',       villaRoutes);
app.use('/api/inquiries',    inquiryRoutes);
app.use('/api/regions',      regionRoutes);
app.use('/api/owners',       ownerRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/competitors',  competitorRoutes);
app.use('/api/reviews',      reviewRoutes);
app.use('/api/ai',           aiRoutes);
app.use('/api/upload',       uploadRoutes);
app.use('/api/payment',      paymentRoutes);

// ── Sağlık kontrolü ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'bizebivilla API çalışıyor 🏡', env: process.env.NODE_ENV });
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Bu endpoint bulunamadı.' });
});

// ── Hata handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Sunucu hatası',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
