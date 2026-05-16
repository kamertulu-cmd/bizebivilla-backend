// src/controllers/payment.controller.js

const Inquiry       = require('../models/inquiry.model');
const Villa         = require('../models/villa.model');
const Availability  = require('../models/availability.model');
const paramService  = require('../services/param.service');
const {
  sendEmail,
  paymentSuccessEmail,
  adminReservationNotificationEmail,
} = require('../services/email.service');

const PUBLIC_URL = process.env.PUBLIC_URL || 'https://bizebivilla.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// ────────────────────────────────────────────────────────────────
// POST /api/payment/init
// Body: { inquiryId, card: { holderName, number, expMonth, expYear, cvc } }
//
// Akış:
//   1. Inquiry'yi bul, "pending_payment" durumunda mı kontrol et
//   2. Param'a TP_Islem_Odeme isteği gönder
//   3. Başarılıysa UCD_URL'i frontend'e döndür (kullanıcı yönlendirilecek)
// ────────────────────────────────────────────────────────────────
exports.initPayment = async (req, res, next) => {
  try {
    const { inquiryId, card } = req.body;

    if (!inquiryId) {
      return res.status(400).json({ success: false, message: 'inquiryId gerekli.' });
    }
    if (!card || !card.number || !card.expMonth || !card.expYear || !card.cvc) {
      return res.status(400).json({ success: false, message: 'Kart bilgileri eksik.' });
    }

    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Rezervasyon bulunamadı.' });
    }
    if (inquiry.status !== 'pending_payment') {
      return res.status(400).json({
        success: false,
        message: `Bu rezervasyon ödemeye uygun durumda değil (mevcut: ${inquiry.status}).`,
      });
    }
    if (inquiry.payment?.status === 'success') {
      return res.status(400).json({ success: false, message: 'Bu rezervasyonun ödemesi zaten yapılmış.' });
    }

    // Tutar — depositAmount (komisyon + temizlik) misafirden online tahsil edilecek
    const amount = inquiry.pricing.depositAmount;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Geçersiz ödeme tutarı.' });
    }

    // Sipariş ID — Param için unique olmalı, daha önce kullanıldıysa yenile
    const orderId = inquiry.payment?.paramOrderId || paramService.generateOrderId(inquiry._id);

    const guestIp = req.ip || req.headers['x-forwarded-for'] || '';

    // Param'a istek
    const result = await paramService.initPayment({
      card: {
        holderName: card.holderName || inquiry.guest.name,
        number: String(card.number).replace(/\s/g, ''),
        expMonth: String(card.expMonth).padStart(2, '0'),
        expYear:  String(card.expYear).length === 2 ? String(card.expYear) : String(card.expYear).slice(-2),
        cvc: String(card.cvc),
      },
      amount,
      orderId,
      guest: {
        email: inquiry.guest.email,
        phone: inquiry.guest.phone,
        ip: guestIp,
      },
      successUrl: `${PUBLIC_URL}/api/payment/callback`,
      failureUrl: `${PUBLIC_URL}/api/payment/callback`,
    });

    if (!result.success) {
      // Hata logu
      inquiry.payment = inquiry.payment || {};
      inquiry.payment.status = 'failed';
      inquiry.payment.paramOrderId = orderId;
      inquiry.payment.failureReason = result.error || 'Ödeme başlatma başarısız';
      await inquiry.save();

      return res.status(400).json({
        success: false,
        message: 'Ödeme başlatılamadı.',
        detail: result.error,
      });
    }

    // Inquiry'yi güncelle - ödeme işlemde
    inquiry.payment = inquiry.payment || {};
    inquiry.payment.status = 'processing';
    inquiry.payment.paramOrderId = orderId;
    inquiry.payment.paramTransactionId = result.transactionId;
    await inquiry.save();

    return res.json({
      success: true,
      data: {
        ucdUrl: result.ucdUrl,         // Frontend bu URL'e yönlendirecek
        orderId,
        transactionId: result.transactionId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────────
// POST /api/payment/callback
// Param'dan gelen 3DS sonuç POST'u
//
// Param x-www-form-urlencoded olarak POST yapar.
// app.js'de urlencoded body parser açık.
// ────────────────────────────────────────────────────────────────
exports.handleCallback = async (req, res, next) => {
  try {
    // Param hem POST hem GET ile gelebilir, ikisini de destekleyelim
    const body = { ...req.query, ...req.body };
    const parsed = paramService.parseCallback(body);

    console.log('💳 Param callback alındı:', {
      success: parsed.success,
      orderId: parsed.orderId,
      sonucCode: parsed.sonucCode,
      sonucStr: parsed.sonucStr,
    });

    if (!parsed.orderId) {
      // Beklenmedik durum — order ID yoksa kullanıcıyı bilgilendir
      return res.redirect(`${PUBLIC_URL}/odeme-basarisiz.html?reason=invalid_callback`);
    }

    const inquiry = await Inquiry.findOne({ 'payment.paramOrderId': parsed.orderId })
      .populate('villa', 'title slug location')
      .populate('owner', 'name email phone');

    if (!inquiry) {
      console.error('Param callback: Inquiry bulunamadı, orderId:', parsed.orderId);
      return res.redirect(`${PUBLIC_URL}/odeme-basarisiz.html?reason=not_found`);
    }

    // Idempotent: zaten işlenmişse tekrar işleme alma
    if (inquiry.payment.status === 'success' && inquiry.status === 'paid') {
      return res.redirect(`${PUBLIC_URL}/odeme-basarili.html?id=${inquiry._id}`);
    }

    if (parsed.success) {
      // ── BAŞARILI ÖDEME ──────────────────────────────────────────
      inquiry.payment.status = 'success';
      inquiry.payment.paramDekontId = parsed.dekontId;
      inquiry.payment.paramTransactionId = parsed.transactionId || inquiry.payment.paramTransactionId;
      inquiry.payment.paidAt = new Date();
      inquiry.payment.rawCallback = parsed.raw;
      inquiry.status = 'paid';
      await inquiry.save();

      // Müsaitlik takvimine ekle ("booked")
      try {
        const exists = await Availability.findOne({ inquiry: inquiry._id });
        if (!exists) {
          await Availability.create({
            villa:      inquiry.villa._id,
            startDate:  inquiry.dates.checkIn,
            endDate:    inquiry.dates.checkOut,
            type:       'booked',
            platform:   'bizebivilla',
            guestName:  inquiry.guest.name,
            guestPhone: inquiry.guest.phone,
            price:      inquiry.pricing.accommodationTotal + inquiry.pricing.cleaningFee,
            nights:     inquiry.pricing.nights,
            inquiry:    inquiry._id,
          });
        }
      } catch (e) {
        console.error('Müsaitlik kaydı oluşturulamadı:', e.message);
      }

      // Mailler — async, hatayı bekleme
      sendPaymentSuccessNotifications(inquiry).catch(e =>
        console.error('Bildirim mailleri gönderim hatası:', e.message)
      );

      return res.redirect(`${PUBLIC_URL}/odeme-basarili.html?id=${inquiry._id}`);
    } else {
      // ── BAŞARISIZ ÖDEME ────────────────────────────────────────
      inquiry.payment.status = 'failed';
      inquiry.payment.failureReason = parsed.sonucStr || 'Ödeme reddedildi';
      inquiry.payment.rawCallback = parsed.raw;
      inquiry.status = 'cancelled';
      inquiry.cancellation = {
        cancelledAt: new Date(),
        cancelledBy: 'system',
        reason: parsed.sonucStr || 'Ödeme başarısız',
      };
      await inquiry.save();

      const reason = encodeURIComponent(parsed.sonucStr || 'Ödeme reddedildi');
      return res.redirect(`${PUBLIC_URL}/odeme-basarisiz.html?reason=${reason}`);
    }
  } catch (err) {
    console.error('Payment callback hatası:', err);
    return res.redirect(`${PUBLIC_URL}/odeme-basarisiz.html?reason=server_error`);
  }
};

// ────────────────────────────────────────────────────────────────
// GET /api/payment/status/:inquiryId
// Frontend ödeme durumunu sorgulamak isterse
// ────────────────────────────────────────────────────────────────
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.inquiryId)
      .populate('villa', 'title slug')
      .select('status payment pricing dates guest villa');

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Rezervasyon bulunamadı.' });
    }

    res.json({
      success: true,
      data: {
        inquiryId:     inquiry._id,
        status:        inquiry.status,
        paymentStatus: inquiry.payment?.status,
        paidAt:        inquiry.payment?.paidAt,
        pricing:       inquiry.pricing,
        dates:         inquiry.dates,
        villa:         inquiry.villa,
        guest:         { name: inquiry.guest.name }, // hassas bilgileri kısıtla
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Yardımcı: başarılı ödeme sonrası mailler ─────────────────────
async function sendPaymentSuccessNotifications(inquiry) {
  // 1. Misafire ödeme başarılı maili
  try {
    const mail = paymentSuccessEmail({
      guestName:     inquiry.guest.name,
      villaTitle:    inquiry.villa.title,
      checkIn:       inquiry.dates.checkIn,
      checkOut:      inquiry.dates.checkOut,
      guests:        inquiry.guestCount,
      depositAmount: inquiry.pricing.depositAmount,
      remainingAmount: inquiry.pricing.remainingAmount,
      cleaningFee:   inquiry.pricing.cleaningFee,
      ownerName:     inquiry.owner?.name,
      ownerPhone:    inquiry.owner?.phone,
    });
    const r = await sendEmail({ to: inquiry.guest.email, subject: mail.subject, html: mail.html });
    console.log('📧 Misafir ödeme onay maili:', r.success ? 'OK' : 'FAIL', r.error || '');
  } catch (e) {
    console.error('Misafir mail hatası:', e.message);
  }

  // 2. Admin'e (bizebivilla operatörü = sen) yeni rezervasyon bildirimi
  if (ADMIN_EMAIL) {
    try {
      const mail = adminReservationNotificationEmail({
        villaTitle:  inquiry.villa.title,
        guestName:   inquiry.guest.name,
        guestEmail:  inquiry.guest.email,
        guestPhone:  inquiry.guest.phone,
        checkIn:     inquiry.dates.checkIn,
        checkOut:    inquiry.dates.checkOut,
        guests:      inquiry.guestCount,
        depositAmount: inquiry.pricing.depositAmount,
        remainingAmount: inquiry.pricing.remainingAmount,
        commission:  inquiry.pricing.commissionAmount,
        ownerName:   inquiry.owner?.name,
        ownerPhone:  inquiry.owner?.phone,
        ownerEmail:  inquiry.owner?.email,
        message:     inquiry.message,
      });
      const r = await sendEmail({ to: ADMIN_EMAIL, subject: mail.subject, html: mail.html });
      console.log('📧 Admin bildirim maili:', r.success ? 'OK' : 'FAIL', r.error || '');
    } catch (e) {
      console.error('Admin mail hatası:', e.message);
    }
  }
}
