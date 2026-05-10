const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');

// Klasör yoksa oluştur
const uploadDir = path.join(__dirname, '../../uploads/villas');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `villa-${req.user._id}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece JPG, PNG ve WEBP formatları kabul edilir.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// POST /api/upload/photos — Çoklu fotoğraf yükle (max 20)
router.post('/photos', protect, upload.array('photos', 20), (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: 'Fotoğraf yüklenmedi.' });
  }

  const urls = req.files.map(f => `/uploads/villas/${f.filename}`);
  res.json({ success: true, urls });
});

// Multer hata yönetimi
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

module.exports = router;
