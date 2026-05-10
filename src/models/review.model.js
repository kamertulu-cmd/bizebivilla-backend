const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  villa: { type: mongoose.Schema.Types.ObjectId, ref: "Villa", required: true },
  guest: {
    name:   { type: String, required: true, trim: true },
    email:  { type: String, lowercase: true, trim: true },
    avatar: { type: String },
  },
  rating: {
    overall:    { type: Number, required: true, min: 1, max: 5 },
    cleanliness:{ type: Number, min: 1, max: 5 },
    location:   { type: Number, min: 1, max: 5 },
    comfort:    { type: Number, min: 1, max: 5 },
    value:      { type: Number, min: 1, max: 5 },
  },
  comment:  { type: String, required: true, maxlength: 1000 },
  stayDate: { type: String },
  isApproved: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

reviewSchema.index({ villa: 1, isApproved: 1 });
reviewSchema.index({ isFeatured: -1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
