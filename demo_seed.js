require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizebivilla';

const villas = [
  {
    title: "Villa Mavi Hayal",
    slug: "villa-mavi-hayal",
    description: "Bodrum Yalikavak'in en seckin konumunda, denize sifir ozel havuzlu lüks villa. Ege'nin masmavi sularini izlerken sabah kahvenizi yudumlayabileceginiz genis terasi, modern ic tasarimi ve genis bahcesiyle unutulmaz bir tatil deneyimi sunuyor. 4 yatak odasinda 8 kisilik konfor, tam donanimli mutfak, akilli ev sistemi ve ozel otopark.",
    location: { region: "Bodrum", district: "Yalikavak" },
    capacity: { guests: 8, bedrooms: 4, bathrooms: 3, beds: 6 },
    area: { indoor: 280, outdoor: 600, floors: 2 },
    amenities: { pool: true, seaView: true, wifi: true, bbq: true, garden: true, airConditioning: true, terrace: true, garage: true },
    pricing: { nightly: 14500, weekly: 95000, cleaningFee: 2000, currency: "TRY", minStay: 3 },
    photos: [
      { url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80", isCover: true, caption: "Havuz ve deniz manzarasi" },
      { url: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80", isCover: false, caption: "Salon" },
      { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80", isCover: false, caption: "Dis cephe" }
    ],
    status: "active", isFeatured: true,
    rating: { average: 4.9, count: 47 }
  },
  {
    title: "Villa Zeytinlik",
    slug: "villa-zeytinlik",
    description: "Fethiye Oludeniz'de zeytin bahceleriyle cevrelenmus, dogayla ic ice efsanevi bir tatil villasi. Tarihi taş mimarisiyle insa edilmis bu benzersiz villa, sonsuzluk havuzuyla Oludeniz'in turunc mavisi uzerine bakar. Sabah kahvaltisinizi taze yemislerle bahcede yapabilir, aksam ise barbekude keyfini cikartabilirsiniz.",
    location: { region: "Fethiye", district: "Oludeniz" },
    capacity: { guests: 10, bedrooms: 5, bathrooms: 4, beds: 8 },
    area: { indoor: 320, outdoor: 1200, floors: 2 },
    amenities: { pool: true, seaView: true, wifi: true, bbq: true, garden: true, airConditioning: true, terrace: true, fireplace: true },
    pricing: { nightly: 11200, weekly: 72000, cleaningFee: 1800, currency: "TRY", minStay: 4 },
    photos: [
      { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80", isCover: true, caption: "Villa ve havuz" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", isCover: false, caption: "Bahce" },
      { url: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80", isCover: false, caption: "Yatak odasi" }
    ],
    status: "active", isFeatured: true,
    rating: { average: 4.8, count: 62 }
  },
  {
    title: "Villa Ege Ruzu",
    slug: "villa-ege-ruzu",
    description: "Alacati'nin simgesi tas evlerden ilham alan bu butik villa, ruzgar degirmenlerine birka adim mesafede konumlanmaktadir. Korunaklı havuzu, genis bahcesi ve butik otelleri aratmayan ic tasarimiyla ciftler ve kucuk aileler icin ideal bir kacis noktasi. Alacati carsisi ve plajlara yurume mesafesinde.",
    location: { region: "Alacati", district: "Merkez" },
    capacity: { guests: 6, bedrooms: 3, bathrooms: 2, beds: 4 },
    area: { indoor: 175, outdoor: 350, floors: 1 },
    amenities: { pool: true, wifi: true, bbq: true, garden: true, airConditioning: true, terrace: true },
    pricing: { nightly: 8500, weekly: 54000, cleaningFee: 1200, currency: "TRY", minStay: 2 },
    photos: [
      { url: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800&q=80", isCover: true, caption: "Tas villa ve bahce" },
      { url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80", isCover: false, caption: "Havuz" },
      { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", isCover: false, caption: "Mutfak" }
    ],
    status: "active", isFeatured: false,
    rating: { average: 4.7, count: 38 }
  },
  {
    title: "Villa Akdeniz",
    slug: "villa-akdeniz",
    description: "Antalya Kemer'de denize 50 metre mesafede, luks ve ferah bir tatil villasi. Genis acik terasi, jakuzisi ve ozel bahcesiyle tam bir dinlenme cocagi. 6 kisilik kapasitesiyle aile tatilleri icin bicemsiz. Kemer merkeze 5 dakika, Phaselis antik kentine 15 dakika mesafede.",
    location: { region: "Antalya", district: "Kemer" },
    capacity: { guests: 6, bedrooms: 3, bathrooms: 3, beds: 5 },
    area: { indoor: 220, outdoor: 450, floors: 2 },
    amenities: { pool: true, jacuzzi: true, seaView: true, beachfront: false, wifi: true, bbq: true, garden: true, airConditioning: true, terrace: true },
    pricing: { nightly: 9800, weekly: 63000, cleaningFee: 1500, currency: "TRY", minStay: 3 },
    photos: [
      { url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80", isCover: true, caption: "Deniz manzarali villa" },
      { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80", isCover: false, caption: "Havuz" },
      { url: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80", isCover: false, caption: "Yatak odasi" }
    ],
    status: "active", isFeatured: true,
    rating: { average: 4.6, count: 29 }
  },
  {
    title: "Villa Marti",
    slug: "villa-marti",
    description: "Bodrum Turkbuku'nun seckin konumunda, denize sifir efsane bir villa. Ege'nin en gozde sosyal mekanina adim mesafesinde olan bu villa; kendine ozgu terasi, sonsuzluk havuzu ve ozel iskelesiyle hayallerinizdeki tatili gercege donusturuyor. Luks tekne kiralama hizmetleriyle de koordineli calisiyoruz.",
    location: { region: "Bodrum", district: "Turkbuku" },
    capacity: { guests: 8, bedrooms: 4, bathrooms: 4, beds: 7 },
    area: { indoor: 310, outdoor: 700, floors: 2 },
    amenities: { pool: true, seaView: true, beachfront: true, wifi: true, bbq: true, garden: true, airConditioning: true, terrace: true, jacuzzi: true },
    pricing: { nightly: 22000, weekly: 140000, cleaningFee: 3000, currency: "TRY", minStay: 5 },
    photos: [
      { url: "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=800&q=80", isCover: true, caption: "Denize sifir villa" },
      { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80", isCover: false, caption: "Oturma alani" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80", isCover: false, caption: "Banyo" }
    ],
    status: "active", isFeatured: true,
    rating: { average: 5.0, count: 18 }
  },
  {
    title: "Villa Koy",
    slug: "villa-koy",
    description: "Marmaris Icmeler'de sakin bir koy icinde gizlenmis butik villa. Korunaklı bahcesi, sonsuz havuzu ve nefes kesen koy manzarasiyla huzur arayanlar icin bulunmaz bir firsat. Sabahleyin deniz sesiyle uyanacak, aksam ise bahcede yildizlarin altinda oturacaksiniz. Koylukdere plajina 3 dakika yurume mesafesi.",
    location: { region: "Marmaris", district: "Icmeler" },
    capacity: { guests: 6, bedrooms: 3, bathrooms: 2, beds: 4 },
    area: { indoor: 160, outdoor: 500, floors: 1 },
    amenities: { pool: true, seaView: true, wifi: true, bbq: true, garden: true, airConditioning: true, terrace: true },
    pricing: { nightly: 7200, weekly: 46000, cleaningFee: 1000, currency: "TRY", minStay: 2 },
    photos: [
      { url: "https://images.unsplash.com/photo-1505873242700-f289a29e1724?w=800&q=80", isCover: true, caption: "Koy manzarali villa" },
      { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", isCover: false, caption: "Bahce ve havuz" },
      { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80", isCover: false, caption: "Mutfak" }
    ],
    status: "active", isFeatured: false,
    rating: { average: 4.7, count: 53 }
  },
  {
    title: "Villa Kas Panorama",
    slug: "villa-kas-panorama",
    description: "Kas'in efsanevi manzarasina hakim, kayaliklara oyulmus benzersiz bir villa. Sonsuzluk havuzundan Yunan adalarini gorebileceginiz bu nadide mekanda zaman durur gibi hissedeceksiniz. Sadeligi ve luks donanimin muhtesem bileseninden olusan villa, ciftler ve kucuk aileler icin idealdir. Kas merkeze 10 dakika.",
    location: { region: "Kas", district: "Merkez" },
    capacity: { guests: 4, bedrooms: 2, bathrooms: 2, beds: 3 },
    area: { indoor: 140, outdoor: 300, floors: 1 },
    amenities: { pool: true, seaView: true, wifi: true, airConditioning: true, terrace: true },
    pricing: { nightly: 8800, weekly: 56000, cleaningFee: 1200, currency: "TRY", minStay: 3 },
    photos: [
      { url: "https://images.unsplash.com/photo-1609602644879-a7a5c6a1c764?w=800&q=80", isCover: true, caption: "Panoramik manzara" },
      { url: "https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=800&q=80", isCover: false, caption: "Sonsuzluk havuzu" },
      { url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", isCover: false, caption: "Yatak odasi" }
    ],
    status: "active", isFeatured: false,
    rating: { average: 4.9, count: 24 }
  },
  {
    title: "Villa Datca Masali",
    slug: "villa-datca-masali",
    description: "Datca yarımadasının el degmemis dogasinda, zeytinlik ve ardic agaclariyla cerceveli bir cennet kose. Iki tarafinda deniz, tamamen mahremiyet, sessizlik ve berrakligi ile Datca size farkli bir tatil perspektifi sunuyor. Ozel iskelesi, sifir ufuk havuzu ve organik bahcesiyle bu villa tam anlamiyla bir masaldir.",
    location: { region: "Datca", district: "Yaziköy" },
    capacity: { guests: 8, bedrooms: 4, bathrooms: 3, beds: 6 },
    area: { indoor: 240, outdoor: 900, floors: 2 },
    amenities: { pool: true, seaView: true, beachfront: true, wifi: true, bbq: true, garden: true, airConditioning: true, terrace: true, fireplace: true },
    pricing: { nightly: 12800, weekly: 82000, cleaningFee: 2000, currency: "TRY", minStay: 4 },
    photos: [
      { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", isCover: true, caption: "Datca manzarali villa" },
      { url: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&q=80", isCover: false, caption: "Havuz ve deniz" },
      { url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80", isCover: false, caption: "Oturma odasi" }
    ],
    status: "active", isFeatured: true,
    rating: { average: 4.8, count: 31 }
  }
];

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('MongoDB baglandi');
  
  const User = require('./src/models/user.model');
  const Villa = require('./src/models/villa.model');

  await Villa.deleteMany({});
  console.log('Eski villalar silindi');

  let owner = await User.findOne({ email: 'ahmet@bizebivilla.com' });
  if (!owner) {
    owner = await User.create({
      name: 'Ahmet Yilmaz',
      email: 'ahmet@bizebivilla.com',
      phone: '05321234567',
      password: 'Test1234!',
      isVerified: true,
    });
  }

  for (const v of villas) {
    await Villa.create({ ...v, owner: owner._id });
    console.log('Eklendi:', v.title);
  }

  console.log('\nTamamlandi! ' + villas.length + ' villa eklendi.');
  process.exit(0);
}).catch(err => { console.error(err.message); process.exit(1); });
