// src/routes/ai.routes.js
// AI proxy endpoints — frontend'den Anthropic API'ye güvenli erişim sağlar

const express = require('express');
const router = express.Router();

// Local body parser — req.body undefined olmasın diye
router.use(express.json({ limit: '2mb' }));

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// POST /api/ai/translate — Türkçe villa metinlerini İngilizceye çevir
router.post('/translate', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'title ve description zorunludur' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'ANTHROPIC_API_KEY .env dosyasında tanımlı değil' });
    }

    const prompt = `Translate the following Turkish villa rental text to natural English. Respond ONLY with JSON, no other text.

Villa name: ${title}
Description: ${description}

JSON format:
{
  "title_en": "English villa title (short, appealing)",
  "description_en": "English description (natural English that preserves the original feel, SEO-friendly)"
}`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Anthropic API hata detayı:', JSON.stringify(data, null, 2));
      const errMsg = data.error?.message || data.message || ('HTTP ' + response.status);
      return res.status(response.status).json({ message: errMsg, details: data });
    }

    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'AI yanıtında JSON bulunamadı', raw: text });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: parsed });
  } catch (e) {
    console.error('AI translate hatası:', e);
    res.status(500).json({ message: e.message });
  }
});

// POST /api/ai/seo — SEO açıklaması üret
router.post('/seo', async (req, res) => {
  try {
    const { title, region, district, guests, bedrooms, bathrooms, nightly, amenities } = req.body;
    if (!title || !region) {
      return res.status(400).json({ message: 'title ve region zorunludur' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'ANTHROPIC_API_KEY tanımlı değil' });
    }

    const prompt = `Sen bir villa kiralama sitesi için SEO uzmanısın. Aşağıdaki villa bilgilerine göre Türkçe SEO uyumlu içerik üret.

Villa Bilgileri:
- Ad: ${title}
- Bölge: ${region}${district ? ', ' + district : ''}
- Kapasite: ${guests || '?'} kişi, ${bedrooms || '?'} yatak odası, ${bathrooms || '?'} banyo
- Gecelik fiyat: ${nightly ? '₺' + Number(nightly).toLocaleString('tr-TR') : 'belirtilmemiş'}
- Olanaklar: ${(amenities || []).join(', ') || 'standart'}

Sadece JSON yanıtla:
{
  "description": "150-200 kelimelik SEO açıklaması",
  "metaDescription": "155 karakterlik özet",
  "keywords": ["10 anahtar kelime"],
  "highlights": ["4 öne çıkan özellik"]
}`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic API hata detayı:', JSON.stringify(data, null, 2));
      const errMsg = data.error?.message || data.message || ('HTTP ' + response.status);
      return res.status(response.status).json({ message: errMsg, details: data });
    }

    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'JSON bulunamadı', raw: text });
    }

    res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
  } catch (e) {
    console.error('AI SEO hatası:', e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
