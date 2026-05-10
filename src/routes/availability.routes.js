const express = require("express");
const router  = express.Router();
const Avail   = require("../models/availability.model");
const { protect } = require("../middleware/auth.middleware");

// Villanın tüm blokları - PUBLIC (site tarafından erişilir)
router.get("/villa/:villaId", async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const filter = { villa: req.params.villaId };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0);
      filter.startDate = { $lte: end };
      filter.endDate   = { $gte: start };
    }
    const blocks = await Avail.find(filter).sort("startDate");
    res.json({ success: true, data: blocks });
  } catch(e) { next(e); }
});

// Blok ekle
router.post("/", protect, async (req, res, next) => {
  try {
    const block = await Avail.create(req.body);
    res.status(201).json({ success: true, data: block });
  } catch(e) { next(e); }
});

// Blok güncelle
router.put("/:id", protect, async (req, res, next) => {
  try {
    const block = await Avail.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: block });
  } catch(e) { next(e); }
});

// Blok sil
router.delete("/:id", protect, async (req, res, next) => {
  try {
    await Avail.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Blok silindi." });
  } catch(e) { next(e); }
});

// Tüm villalar özet
router.get("/summary", protect, async (req, res, next) => {
  try {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const blocks = await Avail.find({ startDate: { $gte: today }, endDate: { $lte: nextMonth } })
      .populate("villa", "title location")
      .sort("startDate")
      .limit(20);
    res.json({ success: true, data: blocks });
  } catch(e) { next(e); }
});

module.exports = router;
