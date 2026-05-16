const Inquiry      = require("../models/inquiry.model");
const Villa        = require("../models/villa.model");
const Availability = require("../models/availability.model");
const {
  sendEmail,
  pendingPaymentEmail,
} = require("../services/email.service");

// ────────────────────────────────────────────────────────────────
// POST /api/inquiries
// Rezervasyon talebi oluşturur — status: pending_payment
// Misafir ödeme yapana kadar bu durumda kalır.
// ────────────────────────────────────────────────────────────────
exports.createInquiry = async (req, res, next) => {
  try {
    const { villaId, guest, dates, guestCount, message } = req.body;

    const villa = await Villa.findById(villaId);
    if (!villa || villa.status !== "active") {
      return res.status(404).json({ success: false, message: "Villa bulunamadi." });
    }

    const checkIn  = new Date(dates.checkIn  + 'T00:00:00');
    const checkOut = new Date(dates.checkOut + 'T00:00:00');

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({ success: false, message: "Gecersiz tarih formati." });
    }
    if (checkIn >= checkOut) {
      return res.status(400).json({ success: false, message: "Cikis tarihi giris tarihinden sonra olmalidir." });
    }
    if (checkIn < new Date()) {
      return res.status(400).json({ success: false, message: "Gecmis tarihe rezervasyon yapilamaz." });
    }

    // Çakışma kontrolü
    const conflict = await Availability.findOne({
      villa: villaId,
      type:  { $in: ["booked", "blocked", "competitor"] },
      $or: [{ startDate: { $lt: checkOut }, endDate: { $gt: checkIn } }],
    });

    if (conflict) {
      const cs = new Date(conflict.startDate).toLocaleDateString("tr-TR");
      const ce = new Date(conflict.endDate).toLocaleDateString("tr-TR");
      return res.status(409).json({
        success: false,
        message: `Bu villa ${cs} - ${ce} tarihleri arasinda dolu.`,
        conflict: { startDate: conflict.startDate, endDate: conflict.endDate, type: conflict.type }
      });
    }

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (villa.pricing.minStay && nights < villa.pricing.minStay) {
      return res.status(400).json({
        success: false,
        message: `Bu villa icin minimum konaklama ${villa.pricing.minStay} gecedir.`
      });
    }

    // ── FİYAT HESAPLAMA ─────────────────────────────────────────
    const nightlyRate        = villa.pricing.nightly;
    const accommodationTotal = nights * nightlyRate;
    const commissionRate     = villa.pricing.commissionRate || 20; // varsayılan %20
    const commissionAmount   = Math.round(accommodationTotal * commissionRate / 100);
    const cleaningFee        = villa.pricing.cleaningFee || 0;

    // Misafir online'da ne ödeyecek: komisyon + temizlik
    const depositAmount = commissionAmount + cleaningFee;
    // Eve girişte sahibe ne ödeyecek: konaklama - komisyon
    const remainingAmount = accommodationTotal - commissionAmount;

    const inquiry = await Inquiry.create({
      villa: villaId,
      owner: villa.owner,
      guest, dates, guestCount, message,
      status: 'pending_payment',
      pricing: {
        nights,
        nightlyRate,
        accommodationTotal,
        commissionRate,
        commissionAmount,
        cleaningFee,
        depositAmount,
        remainingAmount,
        currency: villa.pricing.currency || 'TRY',
      },
      payment: { status: 'pending' },
    });

    // ── Misafire "ödeme bekleniyor" maili ──────────────────────
    if (guest && guest.email) {
      try {
        const mail = pendingPaymentEmail({
          guestName: guest.name || 'Misafir',
          villaTitle: villa.title,
          checkIn: dates.checkIn,
          checkOut: dates.checkOut,
          guests: guestCount || 1,
          depositAmount,
          remainingAmount,
          nights,
          inquiryId: inquiry._id.toString(),
        });
        sendEmail({ to: guest.email, subject: mail.subject, html: mail.html })
          .then(r => console.log('📧 Bekleyen ödeme maili:', r.success ? 'OK' : 'FAIL', r.error || ''))
          .catch(e => console.error('Mail hatası:', e.message));
      } catch (e) {
        console.error('Mail try hatası:', e.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Rezervasyon kaydedildi. Ödeme bekleniyor.",
      data: {
        inquiryId: inquiry._id,
        status: inquiry.status,
        pricing: inquiry.pricing,
        // Frontend ödeme sayfasına yönlendirmek için
        paymentUrl: `/odeme.html?id=${inquiry._id}`,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────────
// GET /api/inquiries/:id
// Misafir kendi rezervasyonunu (özellikle ödeme sayfasında) sorgulayabilsin
// ────────────────────────────────────────────────────────────────
exports.getInquiryById = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('villa', 'title slug location photos pricing')
      .select('-payment.rawCallback'); // ham callback'i gönderme

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Rezervasyon bulunamadı.' });
    }

    res.json({ success: true, data: inquiry });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────────
// GET /api/inquiries/mine — admin için tüm rezervasyonlar
// (Sahip artık panel görmüyor, admin görüyor)
// ────────────────────────────────────────────────────────────────
exports.getMyInquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { owner: req.user._id };
    if (status) filter.status = status;

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .populate("villa", "title slug location photos")
        .sort("-createdAt")
        .skip((page-1)*limit)
        .limit(Number(limit))
        .select('-payment.rawCallback'),
      Inquiry.countDocuments(filter),
    ]);
    res.json({ success: true, total, data: inquiries });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────────────
// PUT /api/inquiries/:id/status — admin'in iptal/onay araçları
// (Sahip kullanmıyor, admin için)
// ────────────────────────────────────────────────────────────────
exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!["paid","cancelled","rejected","completed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Gecersiz durum." });
    }
    const inquiry = await Inquiry.findOne({ _id: req.params.id }).populate("villa","title");
    if (!inquiry) return res.status(404).json({ success: false, message: "Talep bulunamadi." });

    inquiry.status = status;

    if (status === 'cancelled' || status === 'rejected') {
      inquiry.cancellation = {
        cancelledAt: new Date(),
        cancelledBy: 'admin',
        reason: reason || 'Admin tarafından iptal',
      };
      // İlgili müsaitlik kaydını sil
      await Availability.deleteOne({ inquiry: inquiry._id });
    }

    await inquiry.save();
    res.json({ success: true, data: inquiry });
  } catch (err) { next(err); }
};
