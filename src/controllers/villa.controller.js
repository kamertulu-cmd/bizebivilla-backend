const Villa = require('../models/villa.model');

// ── Yardımcı: Sorgu filtresi oluştur ─────────────────────────────
const buildFilter = (query) => {
  const filter = { status: 'active' };

  if (query.region)    filter['location.region'] = query.region;
  if (query.featured)  filter.isFeatured = true;

  // Kapasite
  if (query.guests)    filter['capacity.guests']   = { $gte: Number(query.guests) };
  if (query.bedrooms)  filter['capacity.bedrooms']  = { $gte: Number(query.bedrooms) };

  // Fiyat aralığı
  if (query.minPrice || query.maxPrice) {
    filter['pricing.nightly'] = {};
    if (query.minPrice) filter['pricing.nightly'].$gte = Number(query.minPrice);
    if (query.maxPrice) filter['pricing.nightly'].$lte = Number(query.maxPrice);
  }

  // Olanaklar
  const amenityKeys = ['pool', 'jacuzzi', 'seaView', 'beachfront', 'wifi', 'bbq', 'garden', 'terrace', 'garage', 'gym', 'sauna'];
  amenityKeys.forEach(key => {
    if (query[key] === 'true') filter[`amenities.${key}`] = true;
  });

  // Metin arama
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
};

// ── GET /api/villas ───────────────────────────────────────────────
exports.getAllVillas = async (req, res, next) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(50, Number(req.query.limit) || 12);
    const skip  = (page - 1) * limit;

    const filter = buildFilter(req.query);

    // Sıralama
    let sort = '-createdAt';
    if (req.query.sort === 'price_asc')  sort = 'pricing.nightly';
    if (req.query.sort === 'price_desc') sort = '-pricing.nightly';
    if (req.query.sort === 'rating')     sort = '-rating.average';
    if (req.query.sort === 'popular')    sort = '-viewCount';

    const [villas, total] = await Promise.all([
      Villa.find(filter)
        .populate('owner', 'name phone email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Villa.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: villas,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/villas/featured ──────────────────────────────────────
exports.getFeaturedVillas = async (req, res, next) => {
  try {
    const villas = await Villa.find({ status: 'active', isFeatured: true })
      .populate('owner', 'name avatar')
      .sort('-createdAt')
      .limit(6)
      .select('title slug location capacity pricing photos rating amenities');

    res.json({ success: true, data: villas });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/villas/:slug ─────────────────────────────────────────
exports.getVillaBySlug = async (req, res, next) => {
  try {
    const villa = await Villa.findOne({ slug: req.params.slug, status: 'active' })
      .populate('owner', 'name phone email avatar createdAt');

    if (!villa) {
      return res.status(404).json({ success: false, message: 'Villa bulunamadı.' });
    }

    // Görüntülenme sayısını artır
    villa.viewCount += 1;
    await villa.save({ validateBeforeSave: false });

    res.json({ success: true, data: villa });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/villas ──────────────────────────────────────────────
exports.createVilla = async (req, res, next) => {
  try {
    const villa = await Villa.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: villa });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/villas/:id ───────────────────────────────────────────
exports.updateVilla = async (req, res, next) => {
  try {
    const villa = await Villa.findById(req.params.id);

    if (!villa) {
      return res.status(404).json({ success: false, message: 'Villa bulunamadı.' });
    }

    // Sadece sahibi veya admin güncelleyebilir
    if (villa.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok.' });
    }

    const updated = await Villa.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/villas/:id ────────────────────────────────────────
exports.deleteVilla = async (req, res, next) => {
  try {
    const villa = await Villa.findById(req.params.id);

    if (!villa) {
      return res.status(404).json({ success: false, message: 'Villa bulunamadı.' });
    }

    if (villa.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok.' });
    }

    await villa.deleteOne();
    res.json({ success: true, message: 'Villa silindi.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/villas/my — Kullanıcının kendi villaları ─────────────
exports.getMyVillas = async (req, res, next) => {
  try {
    const villas = await Villa.find({ owner: req.user._id }).sort('-createdAt');
    res.json({ success: true, total: villas.length, data: villas });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/villas/stats — Bölge bazlı istatistikler ────────────
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Villa.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$location.region',
          count: { $sum: 1 },
          avgPrice: { $avg: '$pricing.nightly' },
          minPrice: { $min: '$pricing.nightly' },
          maxPrice: { $max: '$pricing.nightly' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
