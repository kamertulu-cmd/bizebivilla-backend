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

  // Akış: pending_payment → (ödeme başarılı) → paid → completed
  //                       → (ödeme başarısız) → cancelled
  //                       → (manuel iptal) → cancelled
  status: {
    type: String,
    enum: ['pending_payment', 'paid', 'cancelled', 'rejected', 'completed'],
    default: 'pending_payment',
  },

  // ── Fiyat ve komisyon dökümü (snapshot) ─────────────────────────
  // Tüm tutarlar TL (kuruş değil)
  pricing: {
    nights:        { type: Number, required: true, min: 1 },
    nightlyRate:   { type: Number, required: true, min: 0 },        // o anki gecelik fiyat
    accommodationTotal: { type: Number, required: true, min: 0 },   // gece x nightlyRate
    commissionRate: { type: Number, required: true, min: 0, max: 100 }, // %
    commissionAmount: { type: Number, required: true, min: 0 },     // bizebivilla'ya
    cleaningFee:   { type: Number, default: 0 },
    depositAmount: { type: Number, required: true, min: 0 },        // online ödenen = komisyon + temizlik
    remainingAmount: { type: Number, required: true, min: 0 },      // eve girişte sahibe
    currency:      { type: String, default: 'TRY' },
  },

  // ── Ödeme detayları ─────────────────────────────────────────────
  payment: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    paramOrderId:    { type: String, index: true },  // bizim ürettiğimiz Siparis_ID
    paramTransactionId: { type: String },            // Param'dan dönen Islem_ID
    paramDekontId:   { type: String },               // başarılı işlem sonrası Dekont
    paidAt:          { type: Date },
    failureReason:   { type: String },
    rawCallback:     { type: mongoose.Schema.Types.Mixed }, // debug için
  },

  // İptal kademesi takibi (sonraki aşama için hazır)
  cancellation: {
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ['guest', 'owner', 'admin', 'system'] },
    refundAmount: { type: Number },
    reason:      { type: String },
  },

}, { timestamps: true });

inquirySchema.index({ owner: 1, status: 1 });
inquirySchema.index({ villa: 1 });
inquirySchema.index({ 'payment.paramOrderId': 1 });

// Virtual: misafirin ödemesi gereken toplam tutar (konaklama + temizlik)
inquirySchema.virtual('totalAmount').get(function () {
  return (this.pricing?.accommodationTotal || 0) + (this.pricing?.cleaningFee || 0);
});

module.exports = mongoose.model('Inquiry', inquirySchema);
