const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  phone:       { type: String, trim: true },
  phone2:      { type: String, trim: true },
  email:       { type: String, trim: true, lowercase: true },
  iban:        { type: String, trim: true },
  bankName:    { type: String, trim: true },
  address:     { type: String, trim: true },
  idNumber:    { type: String, trim: true },
  commission:  { type: Number, default: 20 }, // % komisyon oranı
  notes:       { type: String },
  isActive:    { type: Boolean, default: true },
  villas:      [{ type: mongoose.Schema.Types.ObjectId, ref: "Villa" }],
}, { timestamps: true });

module.exports = mongoose.model("Owner", ownerSchema);
