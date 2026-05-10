require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Villa = require('./src/models/villa.model');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bizebivilla').then(async () => {
  console.log('MongoDB baglandi');
  await User.deleteMany();
  await Villa.deleteMany();

  const owner = await User.create({
    name: 'Ahmet Yilmaz',
    email: 'ahmet@bizebivilla.com',
    phone: '05321234567',
    password: 'Test1234!',
    isVerified: true,
  });

  await Villa.create({
    owner: owner._id,
    title: 'Ege Manzarali Luks Villa',
    slug: 'ege-manzarali-luks-villa',
    description: 'Bodrum en guzel konumunda havuzlu villa.',
    location: { region: 'Bodrum', district: 'Yalikavak' },
    capacity: { guests: 8, bedrooms: 4, bathrooms: 3, beds: 6 },
    amenities: { pool: true, seaView: true, wifi: true },
    pricing: { nightly: 12500, currency: 'TRY', minStay: 3 },
    photos: [{ url: '/uploads/villas/sample1.jpg', isCover: true }],
    status: 'active',
    isFeatured: true,
    rating: { average: 4.8, count: 24 },
  });

  await Villa.create({
    owner: owner._id,
    title: 'Orman Ici Deniz Villasi',
    slug: 'orman-ici-deniz-villasi',
    description: 'Fethiye sakin koylarinda dogayla ic ice tatil villasi.',
    location: { region: 'Fethiye', district: 'Oludeniz' },
    capacity: { guests: 10, bedrooms: 5, bathrooms: 4, beds: 8 },
    amenities: { pool: true, seaView: true, wifi: true, terrace: true },
    pricing: { nightly: 9800, currency: 'TRY', minStay: 4 },
    photos: [{ url: '/uploads/villas/sample2.jpg', isCover: true }],
    status: 'active',
    isFeatured: true,
    rating: { average: 4.9, count: 18 },
  });

  await Villa.create({
    owner: owner._id,
    title: 'Tas Villa Ruzgar ve Huzur',
    slug: 'tas-villa-ruzgar-ve-huzur',
    description: 'Alacati karakteristik tas yapisi havuzlu villa.',
    location: { region: 'Alacati', district: 'Merkez' },
    capacity: { guests: 6, bedrooms: 3, bathrooms: 2, beds: 4 },
    amenities: { wifi: true, garden: true, terrace: true },
    pricing: { nightly: 7200, currency: 'TRY', minStay: 2 },
    photos: [{ url: '/uploads/villas/sample3.jpg', isCover: true }],
    status: 'active',
    rating: { average: 4.7, count: 31 },
  });

  console.log('Seed tamamlandi! 3 villa eklendi.');
  console.log('Kullanici: ahmet@bizebivilla.com / Test1234!');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
