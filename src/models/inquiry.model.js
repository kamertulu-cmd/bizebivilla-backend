const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  villa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Villa',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Misafir bilgileri (kayıtlı kullanıcı olmayabilir)
  guest: {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, lowercase: true, trim: true },
    phone:   { type: String, trim: true },
  },
  // Rezervasyon talebi
  dates: {
    checkIn:  { type: Date, required: true },
    checkOut: { type: Date, required: true },
  },
  guestCount: { type: Number, required: true, min: 1 },
  message:    { type: String, maxlength: 1000 },

  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'confirmed', 'rejected'],
    default: 'new',
  },

  // Hesaplanan toplam (bilgi amaçlı)
  estimatedTotal: { type: Number },

}, { timestamps: true });

inquirySchema.index({ owner: 1, status: 1 });
inquirySchema.index({ villa: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
