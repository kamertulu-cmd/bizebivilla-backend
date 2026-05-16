const mongoose = require("mongoose");
const slugify = require("slugify");

const villaSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  title_en: { type: String, trim: true },          // İngilizce başlık (AI çeviri)
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  description_en: { type: String },                // İngilizce açıklama (AI çeviri)
  location: {
    region: { type: String, required: true, enum: ["Bodrum","Fethiye","Kas","Cesme","Alacati","Antalya","Marmaris","Datca","Didim","Kusadasi","Diger"] },
    district: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  capacity: {
    guests:   { type: Number, required: true, min: 1 },
    bedrooms: { type: Number, required: true, min: 1 },
    bathrooms:{ type: Number, required: true, min: 1 },
    beds:     { type: Number, default: 1 },
  },
  area: {
    indoor:  { type: Number },
    outdoor: { type: Number },
    floors:  { type: Number, default: 1 },
  },
  amenities: {
    pool:            { type: Boolean, default: false },
    jacuzzi:         { type: Boolean, default: false },
    seaView:         { type: Boolean, default: false },
    beachfront:      { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: true  },
    wifi:            { type: Boolean, default: true  },
    fireplace:       { type: Boolean, default: false },
    bbq:             { type: Boolean, default: false },
    garage:          { type: Boolean, default: false },
    garden:          { type: Boolean, default: false },
    terrace:         { type: Boolean, default: false },
    gym:             { type: Boolean, default: false },
    sauna:           { type: Boolean, default: false },
    generator:       { type: Boolean, default: false },
    satelliteTV:     { type: Boolean, default: false },
    disabledAccess:  { type: Boolean, default: false },
  },
  pricing: {
    nightly:     { type: Number, required: true, min: 0 },
    weekly:      { type: Number },
    monthly:     { type: Number },
    currency:    { type: String, default: "TRY" },
    cleaningFee: { type: Number, default: 0 },
    deposit:     { type: Number, default: 0 },
    minStay:     { type: Number, default: 1 },
    // Komisyon oranı — sahip ile özel olarak belirlenir
    // Ödeme akışında: komisyon = (gece sayısı x nightly) x commissionRate/100
    commissionRate: { type: Number, default: 20, min: 0, max: 100 },
  },
  photos: [{
    url:     { type: String, required: true },
    caption: { type: String },
    isCover: { type: Boolean, default: false },
  }],
  rules: {
    petsAllowed:    { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    partiesAllowed: { type: Boolean, default: false },
    checkInTime:    { type: String, default: "14:00" },
    checkOutTime:   { type: String, default: "12:00" },
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count:   { type: Number, default: 0 },
  },
  status:     { type: String, enum: ["draft","pending","active","inactive"], default: "pending" },
  isFeatured: { type: Boolean, default: false },
  viewCount:  { type: Number, default: 0 },
}, { timestamps: true });

villaSchema.pre("save", async function () {
  if (this.slug) return;
  let slug = slugify(this.title, { lower: true, strict: true });
  const exists = await mongoose.model("Villa").findOne({ slug });
  if (exists) slug = slug + "-" + Date.now();
  this.slug = slug;
});

module.exports = mongoose.model("Villa", villaSchema);
