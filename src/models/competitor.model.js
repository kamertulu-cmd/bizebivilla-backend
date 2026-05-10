const mongoose = require("mongoose");

const competitorSchema = new mongoose.Schema({
  villa:       { type: mongoose.Schema.Types.ObjectId, ref: "Villa", required: true },
  platform:    { type: String, enum: ["airbnb","booking","tatilsepeti","other"], required: true },
  url:         { type: String, trim: true },
  competitorVillaName: { type: String, trim: true },
  region:      { type: String, trim: true },
  priceNightly:{ type: Number },
  priceWeekly: { type: Number },
  capacity:    { type: Number },
  rating:      { type: Number },
  reviewCount: { type: Number },
  amenities:   { type: String },
  notes:       { type: String },
  checkedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

competitorSchema.index({ villa: 1, platform: 1 });

module.exports = mongoose.model("Competitor", competitorSchema);
