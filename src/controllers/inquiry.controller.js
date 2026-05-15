// src/controllers/inquiry.controller.js
const Inquiry = require('../models/inquiry.model');
const Villa = require('../models/villa.model');
const { sendEmail, reservationConfirmationEmail } = require('../services/email.service');

// POST /api/inquiries — Yeni rezervasyon talebi oluştur
exports.createInquiry = async (req, res) => {
  try {
    const { villa: villaId, guestName, guestEmail, guestPhone, checkIn, checkOut, guests, message } = req.body;

    if (!villaId || !guestName || !guestEmail || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Eksik alanlar var (villa, ad, email, tarihler zorunlu)' });
    }

    // Villayı bul (email için title lazım)
    const villa = await Villa.findById(villaId);
    if (!villa) return res.status(404).json({ message: 'Villa bulunamadı' });

    // Inquiry kaydet
    const inquiry = await Inquiry.create({
      villa: villaId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: guests || 1,
      message: message || '',
      status: 'pending'
    });

    // Misafire onay maili (async, bekletmiyoruz)
    const { subject, html } = reservationConfirmationEmail({
      guestName,
      villaTitle: villa.title,
      checkIn,
      checkOut,
      guests: guests || 1,
      message
    });
    sendEmail({ to: guestEmail, subject, html }).catch(e => console.error('Mail hatası:', e));

    res.status(201).json({ success: true, data: inquiry });
  } catch (e) {
    console.error('createInquiry hatası:', e);
    res.status(500).json({ message: e.message });
  }
};

// GET /api/inquiries — Tüm talepleri listele (admin için)
exports.listInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate('villa', 'title location.region')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: inquiries });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH /api/inquiries/:id — Status güncelle
exports.updateInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!inquiry) return res.status(404).json({ message: 'Bulunamadı' });
    res.json({ success: true, data: inquiry });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// DELETE /api/inquiries/:id
exports.deleteInquiry = async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
