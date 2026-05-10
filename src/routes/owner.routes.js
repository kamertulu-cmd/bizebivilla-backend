const express = require("express");
const router  = express.Router();
const Owner   = require("../models/owner.model");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

// Tüm sahipler
router.get("/", async (req, res, next) => {
  try {
    const owners = await Owner.find({ isActive: true }).populate("villas", "title location pricing").sort("name");
    res.json({ success: true, total: owners.length, data: owners });
  } catch(e) { next(e); }
});

// Tek sahip
router.get("/:id", async (req, res, next) => {
  try {
    const owner = await Owner.findById(req.params.id).populate("villas", "title location pricing photos status");
    if (!owner) return res.status(404).json({ success: false, message: "Sahip bulunamadı." });
    res.json({ success: true, data: owner });
  } catch(e) { next(e); }
});

// Ekle
router.post("/", async (req, res, next) => {
  try {
    const owner = await Owner.create(req.body);
    res.status(201).json({ success: true, data: owner });
  } catch(e) { next(e); }
});

// Güncelle
router.put("/:id", async (req, res, next) => {
  try {
    const owner = await Owner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: owner });
  } catch(e) { next(e); }
});

// Sil (soft)
router.delete("/:id", async (req, res, next) => {
  try {
    await Owner.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: "Sahip silindi." });
  } catch(e) { next(e); }
});

module.exports = router;
