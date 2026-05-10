require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/bizebivilla").then(async () => {
  console.log("MongoDB baglandi");

  const Villa      = require("./src/models/villa.model");
  const Owner      = require("./src/models/owner.model");
  const Avail      = require("./src/models/availability.model");
  const Competitor = require("./src/models/competitor.model");

  // Temizle
  await Promise.all([Owner.deleteMany(), Avail.deleteMany(), Competitor.deleteMany()]);

  const villas = await Villa.find({ status: "active" });
  if (!villas.length) { console.log("Villa bulunamadi!"); process.exit(1); }

  // ── SAHİPLER ────────────────────────────────────────────────────
  const owners = await Owner.insertMany([
    { name: "Mehmet Yilmaz", phone: "05321234567", phone2: "05421234567", email: "mehmet@gmail.com", iban: "TR12 0001 0017 4530 0016 0000 01", bankName: "Ziraat Bankasi", idNumber: "12345678901", commission: 20, notes: "Bodrum villasiyla cok ilgili, hizli yanit veriyor. Her Cuma fiyat guncelliyor.", villas: [villas[0]._id] },
    { name: "Ayse Kaya", phone: "05331234567", email: "ayse.kaya@hotmail.com", iban: "TR34 0006 2000 1160 0006 6001 01", bankName: "Yapi Kredi", commission: 25, notes: "Fethiye villasinin sahibi. Temizlik konusunda cok titiz. Min 4 gece istiyor.", villas: [villas[1]._id] },
    { name: "Ali Demir", phone: "05411234567", phone2: "02321234567", email: "alidemir@outlook.com", iban: "TR26 0001 2009 8760 0016 0000 01", bankName: "Is Bankasi", idNumber: "98765432101", commission: 15, notes: "Alacati villasi. Sezon disinda fiyat indirimine acik. Evcil hayvan kabul etmiyor.", villas: [villas[2]._id] },
    { name: "Fatma Ozturk", phone: "05351234567", email: "fatmaozturk@gmail.com", iban: "TR64 0004 6000 1788 8000 0666 66", bankName: "Halkbank", commission: 20, notes: "Antalya & Marmaris. Iki villasi var. Haftalik kiralama tercih ediyor.", villas: villas.slice(3,5).map(v=>v._id) },
    { name: "Hasan Celik", phone: "05361234567", email: "hasancelik@gmail.com", iban: "TR52 0001 5001 5800 7301 9000 01", bankName: "Garanti BBVA", commission: 22, notes: "Datca & Kas villaları. Sezon icinde musait olmayabiliyor. Onceden aramak lazim.", villas: villas.slice(5).map(v=>v._id) },
  ]);
  console.log(owners.length + " sahip eklendi");

  // ── MÜSAİTLİK BLOKLARI ─────────────────────────────────────────
  const today = new Date();
  const d = (offsetDays) => { const dt = new Date(today); dt.setDate(dt.getDate() + offsetDays); return dt; };

  const blocks = [];

  // Villa 0 — Bodrum Mavi Hayal
  blocks.push(
    { villa: villas[0]._id, startDate: d(-14), endDate: d(-7),  type: "booked",     platform: "bizebivilla", guestName: "Burak Sahin",   guestPhone: "05301234567", price: 87000,  nights: 7,  notes: "Tam haftalik kiralama" },
    { villa: villas[0]._id, startDate: d(2),   endDate: d(9),   type: "booked",     platform: "bizebivilla", guestName: "Selin Arslan",  guestPhone: "05311234567", price: 101500, nights: 7,  notes: "Balik sezonu" },
    { villa: villas[0]._id, startDate: d(12),  endDate: d(17),  type: "option",     platform: "bizebivilla", guestName: "Emre Ozkan",    guestPhone: "05321111111", price: 72500,  nights: 5,  notes: "Opsiyon - onay bekleniyor" },
    { villa: villas[0]._id, startDate: d(20),  endDate: d(27),  type: "booked",     platform: "airbnb",      guestName: "Thomas Mueller", price: 95000, nights: 7, notes: "Yabanci misafir - Airbnb" },
    { villa: villas[0]._id, startDate: d(35),  endDate: d(42),  type: "competitor", platform: "booking",     guestName: "Booking.com Rezervasyon", price: 88000, nights: 7 },
  );

  // Villa 1 — Fethiye Zeytinlik
  blocks.push(
    { villa: villas[1]._id, startDate: d(-7),  endDate: d(0),   type: "booked",     platform: "bizebivilla", guestName: "Zeynep Yildiz", guestPhone: "05421234567", price: 78400,  nights: 7  },
    { villa: villas[1]._id, startDate: d(5),   endDate: d(9),   type: "booked",     platform: "tatilsepeti", guestName: "Can Erdem",     price: 44800, nights: 4, notes: "Tatilsepeti" },
    { villa: villas[1]._id, startDate: d(14),  endDate: d(21),  type: "booked",     platform: "bizebivilla", guestName: "Elif Koc",      guestPhone: "05431234567", price: 78400,  nights: 7  },
    { villa: villas[1]._id, startDate: d(28),  endDate: d(35),  type: "option",     platform: "bizebivilla", guestName: "Murat Demir",   guestPhone: "05441234567", price: 78400,  nights: 7, notes: "Opsiyon - yarin yanit verecek" },
  );

  // Villa 2 — Alacati
  blocks.push(
    { villa: villas[2]._id, startDate: d(3),   endDate: d(6),   type: "booked",     platform: "bizebivilla", guestName: "Oya Saglam",    price: 25500, nights: 3 },
    { villa: villas[2]._id, startDate: d(10),  endDate: d(14),  type: "booked",     platform: "airbnb",      guestName: "Sophie Martin",  price: 34000, nights: 4, notes: "Airbnb - Fransiz misafir" },
    { villa: villas[2]._id, startDate: d(18),  endDate: d(20),  type: "blocked",    platform: "bizebivilla", notes: "Onarim - cati tamirat" },
    { villa: villas[2]._id, startDate: d(25),  endDate: d(30),  type: "booked",     platform: "bizebivilla", guestName: "Berk Tunca",    price: 42500, nights: 5 },
  );

  // Villa 3 — Antalya
  blocks.push(
    { villa: villas[3]._id, startDate: d(1),   endDate: d(8),   type: "booked",     platform: "bizebivilla", guestName: "Gurkan Akin",   price: 68600, nights: 7 },
    { villa: villas[3]._id, startDate: d(15),  endDate: d(22),  type: "competitor", platform: "booking",     guestName: "Booking Rez.",  price: 72000, nights: 7 },
    { villa: villas[3]._id, startDate: d(30),  endDate: d(37),  type: "option",     platform: "bizebivilla", guestName: "Deniz Kaya",    price: 68600, nights: 7, notes: "Kapora bekleniyor" },
  );

  // Villa 4 — Marmaris
  blocks.push(
    { villa: villas[4]._id, startDate: d(4),   endDate: d(8),   type: "booked",     platform: "bizebivilla", guestName: "Pinar Yilmaz",  price: 28800, nights: 4 },
    { villa: villas[4]._id, startDate: d(12),  endDate: d(19),  type: "booked",     platform: "airbnb",      guestName: "Hans Weber",    price: 50400, nights: 7, notes: "Airbnb - Alman misafir" },
  );

  await Avail.insertMany(blocks);
  console.log(blocks.length + " musaitlik blogu eklendi");

  // ── RAKİP FİYATLAR ──────────────────────────────────────────────
  const competitors = [];

  // Villa 0 rakipleri (Bizim: 14.500₺)
  competitors.push(
    { villa: villas[0]._id, platform: "airbnb",      competitorVillaName: "Luxury Villa Bodrum Sea View",   url: "https://airbnb.com/rooms/12345", priceNightly: 16200, priceWeekly: 105000, capacity: 8, rating: 4.9, reviewCount: 87, region: "Bodrum Yalikavak", notes: "Havuzlu, denize 50m" },
    { villa: villas[0]._id, platform: "booking",     competitorVillaName: "Villa Aqua Bodrum",              url: "https://booking.com/villa-aqua", priceNightly: 13800, priceWeekly: 89000,  capacity: 6, rating: 9.1, reviewCount: 43, region: "Bodrum Yalikavak", notes: "6 kisilik" },
    { villa: villas[0]._id, platform: "tatilsepeti", competitorVillaName: "Bodrum Havuzlu Lüks Villa",                                            priceNightly: 11500, priceWeekly: 74000,  capacity: 8, rating: 4.7, reviewCount: 31, region: "Bodrum Turkbuku",  notes: "Daha uzak konum" },
    { villa: villas[0]._id, platform: "airbnb",      competitorVillaName: "Sunset Villa Bodrum",            url: "https://airbnb.com/rooms/99999", priceNightly: 18500, capacity: 10, rating: 4.8, reviewCount: 124, region: "Bodrum Yalikavak", notes: "10 kisil, daha buyuk" },
  );

  // Villa 1 rakipleri (Bizim: 11.200₺)
  competitors.push(
    { villa: villas[1]._id, platform: "airbnb",      competitorVillaName: "Olive Garden Villa Fethiye",     url: "https://airbnb.com/rooms/55555", priceNightly: 9800,  priceWeekly: 63000, capacity: 8, rating: 4.7, reviewCount: 56,  region: "Fethiye Oludeniz" },
    { villa: villas[1]._id, platform: "booking",     competitorVillaName: "Blue Lagoon Villa",                                                     priceNightly: 12400, capacity: 10, rating: 8.8, reviewCount: 29, region: "Fethiye Oludeniz", notes: "Sahile daha yakin" },
    { villa: villas[1]._id, platform: "tatilsepeti", competitorVillaName: "Fethiye Bahceli Villa",                                                  priceNightly: 8500,  priceWeekly: 54000, capacity: 8, rating: 4.5, reviewCount: 18,  region: "Fethiye Hisaronu" },
  );

  // Villa 2 rakipleri (Bizim: 8.500₺)
  competitors.push(
    { villa: villas[2]._id, platform: "airbnb",      competitorVillaName: "Stone House Alacati",            url: "https://airbnb.com/rooms/77777", priceNightly: 9200,  capacity: 6, rating: 4.9, reviewCount: 203, region: "Alacati Merkez",  notes: "Cok populer, erken dolduruyor" },
    { villa: villas[2]._id, platform: "booking",     competitorVillaName: "Alacati Boutique Villa",                                                 priceNightly: 7800,  capacity: 4, rating: 9.3, reviewCount: 67,  region: "Alacati Merkez" },
    { villa: villas[2]._id, platform: "tatilsepeti", competitorVillaName: "Alacati Tas Ev",                                                         priceNightly: 6500,  capacity: 6, rating: 4.4, reviewCount: 22,  region: "Alacati Merkez",  notes: "Havuzsuz" },
  );

  // Villa 3 rakipleri (Bizim: 9.800₺)
  competitors.push(
    { villa: villas[3]._id, platform: "airbnb",      competitorVillaName: "Kemer Sea Villa",                                                        priceNightly: 11200, capacity: 6, rating: 4.6, reviewCount: 38, region: "Antalya Kemer" },
    { villa: villas[3]._id, platform: "booking",     competitorVillaName: "Villa Poseidon Kemer",                                                    priceNightly: 8900,  capacity: 6, rating: 8.5, reviewCount: 19, region: "Antalya Kemer" },
  );

  // Villa 4 rakipleri (Bizim: 7.200₺)
  competitors.push(
    { villa: villas[4]._id, platform: "airbnb",      competitorVillaName: "Marmaris Bay Villa",                                                      priceNightly: 8100,  capacity: 6, rating: 4.7, reviewCount: 44, region: "Marmaris Icmeler" },
    { villa: villas[4]._id, platform: "tatilsepeti", competitorVillaName: "Icmeler Koy Villasi",                                                      priceNightly: 6200,  capacity: 6, rating: 4.3, reviewCount: 15, region: "Marmaris Icmeler", notes: "Eski yapim" },
  );

  await Competitor.insertMany(competitors);
  console.log(competitors.length + " rakip fiyat eklendi");

  console.log("\nAdmin seed tamamlandi!");
  console.log("  " + owners.length + " villa sahibi");
  console.log("  " + blocks.length + " musaitlik blogu");
  console.log("  " + competitors.length + " rakip fiyat");
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
