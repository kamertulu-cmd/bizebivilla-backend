require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizebivilla';

// ── MongoDB bağlantısı ─────────────────────────────────────────────
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB bağlantısı kuruldu');
    app.listen(PORT, () => {
      console.log(`🏡 bizebivilla API → http://localhost:${PORT}`);
      console.log(`📋 Ortam: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
    process.exit(1);
  });

// ── Beklenmedik hatalar ────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('Yakalanmamış Promise hatası:', err);
  process.exit(1);
});
