
require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/bizebivilla").then(async () => {
  const Villa = require("./src/models/villa.model");

  const updates = [
    { slug: "villa-mavi-hayal",    desc: "Bodrum Yalikavak'ta denize sifir, ozel havuzlu lüks villa kiralama. 4 yatak odali, 8 kisilik kapasitesiyle aile ve grup tatilleri icin ideal. Marina manzarasi, genis bahce ve modern tasarim. Günlük ve haftalik kiralama secenekleri." },
    { slug: "villa-zeytinlik",     desc: "Fethiye Oludeniz'de zeytin bahceleriyle cerceveli, sonsuzluk havuzlu butik villa. 5 yatak, 10 kisilik. Oludeniz lagününe nefes kesen manzara. Dogayla ic ice huzurlu tatil icin ideal kiralık villa." },
    { slug: "villa-ege-ruzu",      desc: "Alacati merkezde tas mimarili, korunaklı havuzlu butik villa kiralama. 3 yatak, 6 kisilik. Ruzgar degirmenlerine ve Alacati carsisina yurume mesafesinde. Ciftler ve kucuk aileler icin ideal." },
    { slug: "villa-akdeniz",       desc: "Antalya Kemer'de denize 50 metre mesafede havuzlu, jakuzili lüks villa. 3 yatak, 6 kisilik. Akdeniz manzarasi, genis teras. Kemer merkeze 5 dakika. Haftalik kiralama onerilir." },
    { slug: "villa-marti",         desc: "Bodrum Turkbuku'nde denize sifir, ozel iskeleli efsane villa. 4 yatak, 8 kisilik. Sonsuzluk havuzu, jakuzi, Ege manzarasi. Turkbuku sosyal yasami ve plaj kuluplerine adim mesafesi." },
    { slug: "villa-koy",           desc: "Marmaris Icmeler'de sakin bir koy icinde bahceli villa kiralama. 3 yatak, 6 kisilik. Korunaklı havuz, koy manzarasi. Teknelere ve plaja yakin. Huzurlu tatil icin butik villa." },
    { slug: "villa-kas-panorama",  desc: "Kas'ta kayaliklara oyulmus, sonsuzluk havuzlu panoramik villa. 2 yatak, 4 kisilik. Yunan adalari manzarasi, terasa kopyamak mumkun. Dalıs ve tekne turlarina yakin kiralık villa." },
    { slug: "villa-datca-masali",  desc: "Datca yarimarmadasinda iki deniz arasinda, zeytinlik icinde lüks villa. 4 yatak, 8 kisilik. Ozel iskele, sifir ufuk havuzu, el degmemis doga. Huzur ve mahremiyeti arayanlar icin ideal kiralama." },
  ];

  for (const u of updates) {
    await Villa.findOneAndUpdate({ slug: u.slug }, { description: u.desc });
    console.log("Guncellendi:", u.slug);
  }
  console.log("Tum villa aciklamalari SEO icin guncellendi!");
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
