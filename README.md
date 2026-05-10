# bizebivilla — Backend API

Node.js + Express + MongoDB ile kurulu villa kiralama platformu backend'i.

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env içindeki değerleri düzenle

# Geliştirme modunda başlat
npm run dev

# Test verisi ekle (opsiyonel)
npm run seed
```

## 📁 Klasör Yapısı

```
bizebivilla-backend/
├── server.js              # Uygulama başlangıç noktası
├── seed.js                # Test verisi
├── .env.example           # Ortam değişkenleri şablonu
├── uploads/
│   └── villas/            # Yüklenen fotoğraflar
└── src/
    ├── app.js             # Express uygulaması
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── villa.controller.js
    │   └── inquiry.controller.js
    ├── models/
    │   ├── user.model.js
    │   ├── villa.model.js
    │   └── inquiry.model.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── villa.routes.js
    │   ├── inquiry.routes.js
    │   ├── region.routes.js
    │   └── upload.routes.js
    ├── middleware/
    │   └── auth.middleware.js
    └── utils/
        └── jwt.util.js
```

## 📡 API Endpoints

### Auth
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Kayıt ol |
| POST | `/api/auth/login` | Giriş yap |
| GET | `/api/auth/me` | Profil bilgisi |
| PUT | `/api/auth/me` | Profil güncelle |
| PUT | `/api/auth/change-password` | Şifre değiştir |

### Villalar
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/villas` | Tüm villalar (filtreli, sayfalı) |
| GET | `/api/villas/featured` | Öne çıkan villalar |
| GET | `/api/villas/stats` | Bölge istatistikleri |
| GET | `/api/villas/my` | Benim villalarım 🔒 |
| GET | `/api/villas/:slug` | Villa detayı |
| POST | `/api/villas` | Villa oluştur 🔒 |
| PUT | `/api/villas/:id` | Villa güncelle 🔒 |
| DELETE | `/api/villas/:id` | Villa sil 🔒 |

### Bölgeler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/regions` | Bölgeler ve villa sayıları |

### Talepler (Inquiries)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/inquiries` | Rezervasyon talebi gönder |
| GET | `/api/inquiries/mine` | Gelen taleplerim 🔒 |
| PUT | `/api/inquiries/:id/status` | Talep durumu güncelle 🔒 |

### Upload
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/upload/photos` | Fotoğraf yükle (max 20) 🔒 |

> 🔒 JWT token gerektirir: `Authorization: Bearer <token>`

## 🔍 Villa Filtreleme

```
GET /api/villas?region=Bodrum&guests=6&pool=true&minPrice=5000&maxPrice=15000&sort=price_asc&page=1&limit=12
```

| Parametre | Açıklama |
|-----------|----------|
| `region` | Bodrum, Fethiye, Çeşme... |
| `guests` | Min. kişi sayısı |
| `bedrooms` | Min. yatak odası |
| `pool` | Havuzlu villa (true) |
| `seaView` | Deniz manzaralı (true) |
| `minPrice` | Min. gecelik fiyat |
| `maxPrice` | Max. gecelik fiyat |
| `search` | Metin arama |
| `sort` | `price_asc`, `price_desc`, `rating`, `popular` |
| `page` | Sayfa numarası |
| `limit` | Sayfa başı sonuç (max 50) |
