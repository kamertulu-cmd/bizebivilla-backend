// src/controllers/review.controller.js
const Review = require('../models/review.model');
const Villa = require('../models/villa.model');
const { sendEmail, reviewThankYouEmail } = require('../services/email.service');

// POST /api/reviews — Yeni yorum
exports.createReview = async (req, res) => {
  try {
    const { villa: villaId, guestName, guestEmail, rating, comment, stayDate } = req.body;
    if (!villaId || !guestName || !rating || !comment) {
      return res.status(400).json({ message: 'Eksik alanlar (villa, ad, puan, yorum zorunlu)' });
    }

    const villa = await Villa.findById(villaId);
    if (!villa) return res.status(404).json({ message: 'Villa bulunamadı' });

    const review = await Review.create({
      villa: villaId,
      guestName,
      guestEmail: guestEmail || '',
      rating: Number(rating),
      comment,
      stayDate: stayDate ? new Date(stayDate) : new Date(),
      status: 'pending'
    });

    // Misafire teşekkür maili (eğer email verdiyse)
    if (guestEmail) {
      const { subject, html } = reviewThankYouEmail({
        guestName,
        villaTitle: villa.title,
        rating: Number(rating)
      });
      sendEmail({ to: guestEmail, subject, html }).catch(e => console.error('Mail hatası:', e));
    }

    res.status(201).json({ success: true, data: review });
  } catch (e) {
    console.error('createReview hatası:', e);
    res.status(500).json({ message: e.message });
  }
};

// GET /api/reviews/villa/:villaId — Bir villaya ait onaylanmış yorumlar
exports.getReviewsByVilla = async (req, res) => {
  try {
    const reviews = await Review.find({ villa: req.params.villaId, status: 'approved' })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/reviews/all — Tüm yorumlar (anasayfada gösterim için)
exports.getAllReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const reviews = await Review.find({ status: 'approved' })
      .populate('villa', 'title location.region')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, data: reviews });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/reviews/stats — Genel istatistikler
exports.getReviewStats = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' });
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const fiveStars = reviews.filter(r => r.rating === 5).length;
    const satisfactionRate = total ? Math.round((reviews.filter(r => r.rating >= 4).length / total) * 100) : 0;
    res.json({
      success: true,
      data: {
        total,
        average: Number(avg.toFixed(1)),
        fiveStars,
        satisfactionRate
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/reviews — Admin için tüm yorumlar
exports.listReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('villa', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH /api/reviews/:id — Onayla/reddet
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!review) return res.status(404).json({ message: 'Bulunamadı' });
    res.json({ success: true, data: review });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
