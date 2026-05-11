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

module.exports = {
  sendEmail,
  reservationConfirmationEmail,
  reviewThankYouEmail,
};
