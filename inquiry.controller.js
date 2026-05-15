const Inquiry      = require("../models/inquiry.model");
const Villa        = require("../models/villa.model");
const Availability = require("../models/availability.model");
const { sendEmail, reservationConfirmationEmail } = require("../services/email.service");

// POST /api/inquiries
exports.createInquiry = async (req, res, next) => {
  try {
    const { villaId, guest, dates, guestCount, message } = req.body;

    const villa = await Villa.findById(villaId);
    if (!villa || villa.status !== "active") {
      return res.status(404).json({ success: false, message: "Villa bulunamadi." });
    }

    // ── Tarih çakışması kontrolü ──────────────────────────────────
    // ISO formatında tarih bekliyoruz: 2026-05-18
    const checkIn  = new Date(dates.checkIn  + 'T00:00:00');
    const checkOut = new Date(dates.checkOut + 'T00:00:00');

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({ success: false, message: "Gecersiz tarih formati. YYYY-MM-DD bekleniyor." });
    }

    if (checkIn >= checkOut) {
      return res.status(400).json({ success: false, message: "Cikis tarihi giris tarihinden sonra olmalidir." });
    }

    if (checkIn < new Date()) {
      return res.status(400).json({ success: false, message: "Gecmis tarihe rezervasyon yapılamaz." });
    }

    const conflict = await Availability.findOne({
      villa: villaId,
      type:  { $in: ["booked", "blocked", "competitor"] },
      $or: [
        { startDate: { $lt: checkOut }, endDate: { $gt: checkIn } },
      ],
    });

    if (conflict) {
      const conflictStart = new Date(conflict.startDate).toLocaleDateString("tr-TR");
      const conflictEnd   = new Date(conflict.endDate).toLocaleDateString("tr-TR");
      return res.status(409).json({
        success: false,
        message: `Bu villa ${conflictStart} - ${conflictEnd} tarihleri arasinda dolu. Lutfen baska tarih secin.`,
        conflict: { startDate: conflict.startDate, endDate: conflict.endDate, type: conflict.type }
      });
    }

    // Min. konaklama süresi kontrolü
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (villa.pricing.minStay && nights < villa.pricing.minStay) {
      return res.status(400).json({
        success: false,
        message: `Bu villa icin minimum konaklama ${villa.pricing.minStay} gecedir. Siz ${nights} gece secdiniz.`
      });
    }

    const estimatedTotal = nights * villa.pricing.nightly + (villa.pricing.cleaningFee || 0);

    const inquiry = await Inquiry.create({
      villa: villaId, owner: villa.owner,
      guest, dates, guestCount, message, estimatedTotal,
    });

    // ── Misafire onay maili (async, hatası bekletmiyoruz) ────────
    if (guest && guest.email) {
      const mail = reservationConfirmationEmail({
        guestName: guest.name || 'Misafir',
        villaTitle: villa.title,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guests: guestCount || 1,
        message: message || ''
      });
      sendEmail({ to: guest.email, subject: mail.subject, html: mail.html })
        .then(r => console.log('📧 Rezervasyon mail durumu:', r.success ? 'OK' : 'BAŞARISIZ', r.error || ''))
        .catch(e => console.error('Mail hatası:', e.message));
    }

    res.status(201).json({
      success: true,
      message: "Talebiniz villa sahibine iletildi.",
      data: inquiry,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/inquiries/mine
exports.getMyInquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { owner: req.user._id };
    if (status) filter.status = status;
    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter).populate("villa", "title slug location photos").sort("-createdAt").skip((page-1)*limit).limit(Number(limit)),
      Inquiry.countDocuments(filter),
    ]);
    res.json({ success: true, total, data: inquiries });
  } catch (err) { next(err); }
};

// PUT /api/inquiries/:id/status
exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["read","replied","confirmed","rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Gecersiz durum." });
    }
    const inquiry = await Inquiry.findOne({ _id: req.params.id, owner: req.user._id }).populate("villa","title");
    if (!inquiry) return res.status(404).json({ success: false, message: "Talep bulunamadi." });

    inquiry.status = status;
    await inquiry.save();

    // Onaylanırsa takvime otomatik ekle
    if (status === "confirmed") {
      const exists = await Availability.findOne({ inquiry: inquiry._id });
      if (!exists) {
        await Availability.create({
          villa:      inquiry.villa._id,
          startDate:  inquiry.dates.checkIn,
          endDate:    inquiry.dates.checkOut,
          type:       "booked",
          platform:   "bizebivilla",
          guestName:  inquiry.guest.name,
          guestPhone: inquiry.guest.phone,
          price:      inquiry.estimatedTotal,
          nights:     Math.ceil((new Date(inquiry.dates.checkOut) - new Date(inquiry.dates.checkIn)) / (1000*60*60*24)),
          inquiry:    inquiry._id,
        });
      }
    }

    res.json({ success: true, data: inquiry });
  } catch (err) { next(err); }
};
