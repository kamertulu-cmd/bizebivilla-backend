const express = require('express');
const router  = express.Router();
const Villa   = require('../models/villa.model');

// GET /api/regions — Bölge listesi ve villa sayıları
router.get('/', async (req, res, next) => {
  try {
    const stats = await Villa.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$location.region',
          count:    { $sum: 1 },
          avgPrice: { $avg: '$pricing.nightly' },
          minPrice: { $min: '$pricing.nightly' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const regions = stats.map(s => ({
      name:     s._id,
      count:    s.count,
      avgPrice: Math.round(s.avgPrice),
      minPrice: Math.round(s.minPrice),
    }));

    res.json({ success: true, data: regions });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
