const Review = require("../models/review.model");
const Villa  = require("../models/villa.model");

// GET /api/reviews — tüm öne çıkan yorumlar (ana sayfa)
exports.getFeaturedReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ isApproved: true, isFeatured: true })
      .populate("villa", "title location slug")
      .sort("-createdAt")
      .limit(6);
    res.json({ success: true, data: reviews });
  } catch(e) { next(e); }
};

// GET /api/reviews/all — tüm yorumlar (yorumlar sayfası)
exports.getAllReviews = async (req, res, next) => {
  try {
    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(20, Number(req.query.limit) || 12);
    const filter = { isApproved: true };
    if (req.query.villa) filter.villa = req.query.villa;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("villa", "title location slug photos")
        .sort("-createdAt")
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments(filter),
    ]);
    res.json({ success: true, total, page, pages: Math.ceil(total / limit), data: reviews });
  } catch(e) { next(e); }
};

// GET /api/reviews/villa/:villaId — belirli villanın yorumları
exports.getVillaReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ villa: req.params.villaId, isApproved: true })
      .sort("-createdAt");
    res.json({ success: true, total: reviews.length, data: reviews });
  } catch(e) { next(e); }
};

// POST /api/reviews — yeni yorum
exports.createReview = async (req, res, next) => {
  try {
    const { villaId, guest, rating, comment, stayDate } = req.body;
    const villa = await Villa.findById(villaId);
    if (!villa) return res.status(404).json({ success: false, message: "Villa bulunamadi." });

    const review = await Review.create({ villa: villaId, guest, rating, comment, stayDate });

    // Villa rating güncelle
    const all = await Review.find({ villa: villaId, isApproved: true });
    const avg = all.reduce((s, r) => s + r.rating.overall, 0) / all.length;
    await Villa.findByIdAndUpdate(villaId, { "rating.average": Math.round(avg * 10) / 10, "rating.count": all.length });

    res.status(201).json({ success: true, message: "Yorumunuz alindi, tesekkurler!", data: review });
  } catch(e) { next(e); }
};

// GET /api/reviews/stats — genel istatistik
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Review.aggregate([
      { $match: { isApproved: true } },
      { $group: {
        _id: null,
        total:   { $sum: 1 },
        avgRating: { $avg: "$rating.overall" },
        avg5: { $sum: { $cond: [{ $eq: ["$rating.overall", 5] }, 1, 0] } },
        avg4: { $sum: { $cond: [{ $eq: ["$rating.overall", 4] }, 1, 0] } },
        avg3: { $sum: { $cond: [{ $eq: ["$rating.overall", 3] }, 1, 0] } },
      }}
    ]);
    res.json({ success: true, data: stats[0] || { total: 0, avgRating: 0 } });
  } catch(e) { next(e); }
};
