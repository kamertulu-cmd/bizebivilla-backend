require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/bizebivilla").then(async () => {
  const Villa  = require("./src/models/villa.model");
  const Review = require("./src/models/review.model");

  await Review.deleteMany({});
  const villas = await Villa.find({ status: "active" });

  const names = ["Ayse K.","Mehmet Y.","Zeynep A.","Can D.","Elif S.","Burak T.","Selin M.","Ali R.","Fatma N.","Emre O."];
  const comments = [
    "Harikaydı! Villa tam tanımlandığı gibiydi, havuz pırıl pırıldı. Kesinlikle tekrar geleceğiz.",
    "Mükemmel konum, muhteşem manzara. Ev sahibi çok ilgiliydi, her şey hazırdı.",
    "Çocuklarımızla harika bir tatil geçirdik. Bahçe çok büyük ve güvenli, havuz soğuk değil.",
    "Beklentilerimin çok üzerindeydi. Fotoğraflar gerçeği bile aratıyor, keşke daha uzun kalsaydık.",
    "Temizlik mükemmeldi, donanım eksiksizdi. Sabah kahvaltısını terasta yedik, unutamıyoruz.",
    "Denize bu kadar yakın ve bu kadar sakin bir yer bulmak inanılmaz. Tekrar göreceğiz!",
    "Balayımızı burada geçirdik, hayatımızın en güzel haftasıydı. Teşekkürler!",
    "Arkadaşlarımızla geldik, villa herkese yetti. Mangal alanı ve havuz çok güzeldi.",
    "Fiyat performans açısından çok iyi. Bu kalitede bir villa için makul bir ücret.",
    "Doğanın içinde huzur dolu bir tatil. İstanbul'un kalabalığından kaçmak isteyenlere tavsiye ederim.",
  ];

  const months = ["Temmuz 2024","Ağustos 2024","Haziran 2024","Eylül 2024","Temmuz 2024","Ağustos 2024"];
  let count = 0;

  for (const villa of villas) {
    const reviewCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < reviewCount; i++) {
      const overall = Math.random() > 0.2 ? 5 : 4;
      await Review.create({
        villa: villa._id,
        guest: { name: names[Math.floor(Math.random() * names.length)] },
        rating: {
          overall,
          cleanliness: overall,
          location: overall,
          comfort: Math.random() > 0.3 ? overall : overall - 1,
          value: Math.random() > 0.3 ? overall : overall - 1,
        },
        comment: comments[Math.floor(Math.random() * comments.length)],
        stayDate: months[Math.floor(Math.random() * months.length)],
        isApproved: true,
        isFeatured: i === 0,
      });
      count++;
    }
  }

  console.log(count + " yorum eklendi!");
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
