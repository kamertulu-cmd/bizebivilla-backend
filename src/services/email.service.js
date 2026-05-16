// src/services/email.service.js
// Resend ile email gönderme servisi

const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY tanımlı değil — email gönderilemedi');
    return { success: false, error: 'RESEND_API_KEY missing' };
  }

  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const fromName = process.env.EMAIL_FROM_NAME || 'bizebivilla';

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend hatası:', data);
      return { success: false, error: data.message || 'Resend API error', details: data };
    }

    console.log('✉️  Mail gönderildi:', { to, subject, id: data.id });
    return { success: true, id: data.id };
  } catch (e) {
    console.error('Email gönderim hatası:', e.message);
    return { success: false, error: e.message };
  }
}

// Misafir rezervasyon onay maili
function reservationConfirmationEmail({ guestName, villaTitle, checkIn, checkOut, guests, message }) {
  const subject = `Talebiniz alındı — ${villaTitle}`;
  const checkInFormatted = new Date(checkIn).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  const checkOutFormatted = new Date(checkOut).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; background: #f5f3ef; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px 32px; }
      .logo { font-size: 28px; font-weight: 700; color: #0c4a6e; margin-bottom: 8px; }
      .logo .bi { color: #0ea5e9; }
      .tagline { color: #64748b; font-size: 13px; margin-bottom: 32px; letter-spacing: 0.5px; }
      h1 { font-size: 22px; margin: 0 0 16px; color: #0c4a6e; }
      .detail-box { background: #f8fafc; border-radius: 10px; padding: 20px; margin: 24px 0; border-left: 4px solid #0ea5e9; }
      .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
      .detail-row:last-child { border-bottom: none; }
      .detail-label { color: #64748b; font-size: 13px; }
      .detail-value { font-weight: 600; color: #1a1a1a; font-size: 14px; }
      .cta { display: inline-block; background: #0ea5e9; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
      .footer { text-align: center; color: #94a3b8; font-size: 12px; padding-top: 32px; border-top: 1px solid #e2e8f0; margin-top: 32px; }
      a { color: #0ea5e9; }
    </style></head><body>
    <div class="container">
      <div class="logo">bize<span class="bi">bi</span>villa</div>
      <div class="tagline">EVİNE YAKIŞANI BULURUZ</div>
      
      <h1>Merhaba ${guestName}, talebiniz alındı! 🌊</h1>
      <p>Villa rezervasyon talebinizi aldık. Ekibimiz en kısa sürede sizinle iletişime geçerek müsaitlik ve detayları teyit edecek.</p>
      
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Villa</span><span class="detail-value">${villaTitle}</span></div>
        <div class="detail-row"><span class="detail-label">Giriş tarihi</span><span class="detail-value">${checkInFormatted}</span></div>
        <div class="detail-row"><span class="detail-label">Çıkış tarihi</span><span class="detail-value">${checkOutFormatted}</span></div>
        <div class="detail-row"><span class="detail-label">Misafir sayısı</span><span class="detail-value">${guests} kişi</span></div>
        ${message ? `<div class="detail-row"><span class="detail-label">Notunuz</span><span class="detail-value">${message}</span></div>` : ''}
      </div>
      
      <p>Bu sırada villalarımızı incelemeye devam edebilirsiniz:</p>
      <p><a href="https://bizebivilla.com" class="cta">Diğer Villalara Göz At</a></p>
      
      <p style="color:#64748b;font-size:14px">Acil sorularınız için WhatsApp üzerinden de ulaşabilirsiniz.</p>
      
      <div class="footer">
        bizebivilla — Türkiye'nin seçkin villa kiralama platformu<br>
        <a href="https://bizebivilla.com">bizebivilla.com</a>
      </div>
    </div></body></html>
  `;

  return { subject, html };
}

// Misafir yorum teşekkür maili
function reviewThankYouEmail({ guestName, villaTitle, rating }) {
  const subject = `Yorumunuz için teşekkürler — ${villaTitle}`;
  const stars = '⭐'.repeat(rating);
  
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; background: #f5f3ef; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px 32px; }
      .logo { font-size: 28px; font-weight: 700; color: #0c4a6e; margin-bottom: 8px; }
      .logo .bi { color: #0ea5e9; }
      .tagline { color: #64748b; font-size: 13px; margin-bottom: 32px; letter-spacing: 0.5px; }
      h1 { font-size: 22px; margin: 0 0 16px; color: #0c4a6e; }
      .stars { font-size: 24px; margin: 16px 0; }
      .footer { text-align: center; color: #94a3b8; font-size: 12px; padding-top: 32px; border-top: 1px solid #e2e8f0; margin-top: 32px; }
      a { color: #0ea5e9; }
    </style></head><body>
    <div class="container">
      <div class="logo">bize<span class="bi">bi</span>villa</div>
      <div class="tagline">EVİNE YAKIŞANI BULURUZ</div>
      
      <h1>Teşekkürler ${guestName}! 💙</h1>
      <p><strong>${villaTitle}</strong> hakkındaki değerlendirmenizi aldık.</p>
      <div class="stars">${stars}</div>
      <p>Yorumunuz incelendikten sonra sitede yayınlanacak ve diğer misafirlere yol gösterecek. Görüşleriniz bizim için çok değerli.</p>
      <p>Yeniden görüşmek üzere!</p>
      
      <div class="footer">
        bizebivilla — Türkiye'nin seçkin villa kiralama platformu<br>
        <a href="https://bizebivilla.com">bizebivilla.com</a>
      </div>
    </div></body></html>
  `;

  return { subject, html };
}

// ──────────────────────────────────────────────────────────────────
// Yeni — Ödeme akışı mailleri
// ──────────────────────────────────────────────────────────────────

// Ortak header/footer/style (DRY için inline tutulur)
const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background: #f5f3ef; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px 32px; }
  .logo { font-size: 28px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
  .logo .bi { color: #1a8fd9; }
  .tagline { color: #888; font-size: 11px; margin-bottom: 28px; letter-spacing: 3px; }
  h1 { font-size: 22px; margin: 0 0 14px; color: #1a1a1a; }
  .detail-box { background: #f8fafc; border-radius: 10px; padding: 18px 22px; margin: 20px 0; border-left: 4px solid #1a8fd9; }
  .detail-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { color: #64748b; }
  .detail-value { font-weight: 600; color: #1a1a1a; }
  .price-box { background: #e8f4fb; border-radius: 10px; padding: 18px 22px; margin: 20px 0; }
  .price-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .price-row.total { padding-top: 12px; border-top: 2px solid #1a8fd9; margin-top: 8px; font-weight: 700; color: #1a8fd9; font-size: 16px; }
  .cta { display: inline-block; background: #1a8fd9; color: #fff !important; padding: 14px 26px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  .warning-box { background: #fff7e6; border-left: 4px solid #f5a623; border-radius: 8px; padding: 14px 18px; margin: 18px 0; font-size: 13px; color: #555; }
  .footer { text-align: center; color: #94a3b8; font-size: 12px; padding-top: 28px; border-top: 1px solid #e2e8f0; margin-top: 32px; }
  a { color: #1a8fd9; }
`;

const headerHtml = `
  <div class="logo">bize<span class="bi">bi</span>villa</div>
  <div class="tagline">EVİNE YAKIŞANI BULURUZ</div>
`;

const footerHtml = `
  <div class="footer">
    bizebivilla — Türkiye'nin nitelikli villa kiralama platformu<br>
    <a href="https://bizebivilla.com">bizebivilla.com</a>
  </div>
`;

const fmtDate = d => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
const fmtMoney = n => Number(n).toLocaleString('tr-TR') + ' ₺';

// ── 1) Ödeme bekleniyor — Inquiry oluştuğunda misafire ─────────
function pendingPaymentEmail({ guestName, villaTitle, checkIn, checkOut, guests, depositAmount, remainingAmount, nights, inquiryId }) {
  const subject = `Rezervasyonunuz için ödeme bekleniyor — ${villaTitle}`;
  const paymentUrl = `https://bizebivilla.com/odeme.html?id=${inquiryId}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>
    <div class="container">
      ${headerHtml}
      <h1>Merhaba ${guestName}, son bir adım kaldı 💳</h1>
      <p>Rezervasyon talebinizi aldık. Rezervasyonun kesinleşmesi için aşağıdaki tutarı online ödemeniz gerekiyor.</p>

      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Villa</span><span class="detail-value">${villaTitle}</span></div>
        <div class="detail-row"><span class="detail-label">Giriş</span><span class="detail-value">${fmtDate(checkIn)}</span></div>
        <div class="detail-row"><span class="detail-label">Çıkış</span><span class="detail-value">${fmtDate(checkOut)}</span></div>
        <div class="detail-row"><span class="detail-label">Süre</span><span class="detail-value">${nights} gece</span></div>
        <div class="detail-row"><span class="detail-label">Misafir</span><span class="detail-value">${guests} kişi</span></div>
      </div>

      <div class="price-box">
        <div class="price-row total"><span>Şimdi ödenecek</span><span>${fmtMoney(depositAmount)}</span></div>
        <div class="price-row"><span>Eve girişte sahibine</span><span>${fmtMoney(remainingAmount)}</span></div>
      </div>

      <p><a href="${paymentUrl}" class="cta">Ödemeyi Yap</a></p>

      <div class="warning-box">
        <strong>Önemli:</strong> Bu link size özeldir ve sadece sizin rezervasyonunuza aittir. Ödeme yapana kadar villa rezerve edilmez, başka bir misafir aynı tarihleri alabilir.
      </div>

      <p style="color:#64748b;font-size:13px">Yardıma mı ihtiyacınız var? Bu maile cevap verebilir veya WhatsApp üzerinden bize ulaşabilirsiniz.</p>

      ${footerHtml}
    </div></body></html>`;

  return { subject, html };
}

// ── 2) Ödeme başarılı — misafire ──────────────────────────────
function paymentSuccessEmail({ guestName, villaTitle, checkIn, checkOut, guests, depositAmount, remainingAmount, cleaningFee, ownerName, ownerPhone }) {
  const subject = `Ödemeniz alındı, rezervasyonunuz kesinleşti — ${villaTitle} 🎉`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>
    <div class="container">
      ${headerHtml}
      <h1>${guestName}, harika haber! 🌊</h1>
      <p>Ödemeniz başarıyla alındı, <strong>${villaTitle}</strong> rezervasyonunuz kesinleşti. Tatiliniz şimdiden başlasın!</p>

      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Villa</span><span class="detail-value">${villaTitle}</span></div>
        <div class="detail-row"><span class="detail-label">Giriş</span><span class="detail-value">${fmtDate(checkIn)}</span></div>
        <div class="detail-row"><span class="detail-label">Çıkış</span><span class="detail-value">${fmtDate(checkOut)}</span></div>
        <div class="detail-row"><span class="detail-label">Misafir</span><span class="detail-value">${guests} kişi</span></div>
      </div>

      <div class="price-box">
        <div class="price-row"><span>Online ödenen</span><span>${fmtMoney(depositAmount)}</span></div>
        <div class="price-row total"><span>Eve girişte sahibine</span><span>${fmtMoney(remainingAmount)}</span></div>
        ${cleaningFee > 0 ? `<div style="font-size:12px;color:#666;margin-top:8px">Online ödeme: hizmet bedeli + temizlik (${fmtMoney(cleaningFee)})</div>` : ''}
      </div>

      <div class="warning-box">
        <strong>Eve giriş günü:</strong> Kalan tutarı (${fmtMoney(remainingAmount)}) doğrudan villa sahibine ödeyeceksiniz. Sahip sizinle önümüzdeki günlerde iletişime geçecek.
        ${ownerName ? `<br><br><strong>Villa sahibi:</strong> ${ownerName}${ownerPhone ? ` · ${ownerPhone}` : ''}` : ''}
      </div>

      <p style="color:#64748b;font-size:13px">Sorularınız için bu maile cevap verebilirsiniz.</p>
      ${footerHtml}
    </div></body></html>`;

  return { subject, html };
}

// ── 3) Admin (bizebivilla operatörü) bildirimi ────────────────
function adminReservationNotificationEmail({ villaTitle, guestName, guestEmail, guestPhone, checkIn, checkOut, guests, depositAmount, remainingAmount, commission, ownerName, ownerPhone, ownerEmail, message }) {
  const subject = `💰 Yeni ödenmiş rezervasyon — ${villaTitle} · ${guestName}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>
    <div class="container">
      ${headerHtml}
      <h1>Yeni bir rezervasyon var! 🏡</h1>
      <p>Ödeme alındı, sahibe bilgi vermeyi unutma:</p>

      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Villa</span><span class="detail-value">${villaTitle}</span></div>
        <div class="detail-row"><span class="detail-label">Giriş</span><span class="detail-value">${fmtDate(checkIn)}</span></div>
        <div class="detail-row"><span class="detail-label">Çıkış</span><span class="detail-value">${fmtDate(checkOut)}</span></div>
        <div class="detail-row"><span class="detail-label">Misafir</span><span class="detail-value">${guests} kişi</span></div>
      </div>

      <h3 style="margin-top:24px;margin-bottom:8px;color:#1a8fd9;font-size:14px;letter-spacing:1px">MİSAFİR</h3>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Ad-Soyad</span><span class="detail-value">${guestName}</span></div>
        <div class="detail-row"><span class="detail-label">E-posta</span><span class="detail-value">${guestEmail}</span></div>
        <div class="detail-row"><span class="detail-label">Telefon</span><span class="detail-value">${guestPhone || '-'}</span></div>
        ${message ? `<div class="detail-row"><span class="detail-label">Not</span><span class="detail-value">${message}</span></div>` : ''}
      </div>

      <h3 style="margin-top:24px;margin-bottom:8px;color:#1a8fd9;font-size:14px;letter-spacing:1px">VİLLA SAHİBİ</h3>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Ad-Soyad</span><span class="detail-value">${ownerName || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Telefon</span><span class="detail-value">${ownerPhone || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">E-posta</span><span class="detail-value">${ownerEmail || '-'}</span></div>
      </div>

      <h3 style="margin-top:24px;margin-bottom:8px;color:#1a8fd9;font-size:14px;letter-spacing:1px">PARA AKIŞI</h3>
      <div class="price-box">
        <div class="price-row"><span>Online ödenen (sizde)</span><span>${fmtMoney(depositAmount)}</span></div>
        <div class="price-row total"><span style="color:#1a8fd9">Net komisyon</span><span>${fmtMoney(commission)}</span></div>
        <div class="price-row" style="margin-top:8px"><span>Eve girişte sahibe (misafir ödeyecek)</span><span>${fmtMoney(remainingAmount)}</span></div>
      </div>

      <div class="warning-box">
        <strong>Yapılacak işlem:</strong> Sahibi arayıp/WhatsApp'tan yazıp rezervasyon bilgisini ilet. Misafirin iletişim bilgilerini ona ver.
      </div>

      ${footerHtml}
    </div></body></html>`;

  return { subject, html };
}

module.exports = {
  sendEmail,
  reservationConfirmationEmail,
  reviewThankYouEmail,
  // Yeni:
  pendingPaymentEmail,
  paymentSuccessEmail,
  adminReservationNotificationEmail,
};
