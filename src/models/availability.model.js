const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  villa:       { type: mongoose.Schema.Types.ObjectId, ref: "Villa", required: true },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  type:        { type: String, enum: ["booked","option","blocked","competitor"], default: "booked" },
  platform:    { type: String, enum: ["bizebivilla","airbnb","booking","tatilsepeti","other"], default: "bizebivilla" },
  guestName:   { type: String, trim: true },
  guestPhone:  { type: String, trim: true },
  price:       { type: Number },
  nights:      { type: Number },
  notes:       { type: String },
  inquiry:     { type: mongoose.Schema.Types.ObjectId, ref: "Inquiry" },
}, { timestamps: true });

blockSchema.index({ villa: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Availability", blockSchema);
