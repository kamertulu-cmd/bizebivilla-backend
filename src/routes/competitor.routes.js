const express    = require("express");
const router     = express.Router();
const Competitor = require("../models/competitor.model");
const Villa      = require("../models/villa.model");
const { protect }= require("../middleware/auth.middleware");

router.use(protect);

// Tüm rakip fiyatlar
router.get("/", async (req, res, next) => {
  try {
    const { villa } = req.query;
    const filter = villa ? { villa } : {};
    const data = await Competitor.find(filter).populate("villa","title location pricing").sort("-checkedAt");
    res.json({ success: true, total: data.length, data });
  } catch(e) { next(e); }
});

// Analiz özeti (villa bazlı karşılaştırma)
router.get("/analysis", async (req, res, next) => {
  try {
    const villas = await Villa.find({ status: "active" }).select("title location pricing rating");
    const competitors = await Competitor.find({});

    const analysis = villas.map(v => {
      const comps = competitors.filter(c => c.villa.toString() === v._id.toString());
      const avgComp = comps.length ? Math.round(comps.reduce((s,c) => s + (c.priceNightly||0), 0) / comps.length) : null;
      const minComp = comps.length ? Math.min(...comps.map(c => c.priceNightly||9999)) : null;
      const maxComp = comps.length ? Math.max(...comps.map(c => c.priceNightly||0)) : null;
      const diff = avgComp ? Math.round(((v.pricing.nightly - avgComp) / avgComp) * 100) : null;
      return {
        villa: { _id: v._id, title: v.title, region: v.location.region, nightly: v.pricing.nightly, rating: v.rating },
        competitors: comps,
        stats: { avgComp, minComp, maxComp, diff, count: comps.length }
      };
    });

    res.json({ success: true, data: analysis });
  } catch(e) { next(e); }
});

// Ekle
router.post("/", async (req, res, next) => {
  try {
    const comp = await Competitor.create({ ...req.body, checkedAt: new Date() });
    res.status(201).json({ success: true, data: comp });
  } catch(e) { next(e); }
});

// Güncelle
router.put("/:id", async (req, res, next) => {
  try {
    const comp = await Competitor.findByIdAndUpdate(req.params.id, { ...req.body, checkedAt: new Date() }, { new: true });
    res.json({ success: true, data: comp });
  } catch(e) { next(e); }
});

// Sil
router.delete("/:id", async (req, res, next) => {
  try {
    await Competitor.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch(e) { next(e); }
});

module.exports = router;
