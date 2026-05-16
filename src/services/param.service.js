// src/services/param.service.js
// Param POS Servisi - TP_Islem_Odeme (3D Secure ödeme başlatma)
//
// Dokümantasyon: https://dev.param.com.tr/tr/api/odeme
//
// Akış:
//   1. initPayment(): Param'a SOAP isteği gönder, UCD_URL al
//   2. Misafir UCD_URL'e yönlendirilir, 3DS doğrulamasını yapar
//   3. Param sonucu Basarili_URL veya Hata_URL'e POST eder (callback)
//   4. parseCallback() callback'i parse eder

const crypto = require('crypto');

// ── Ortam değişkenleri ────────────────────────────────────────────
const ENV = process.env.PARAM_ENV || 'test';          // 'test' veya 'production'
const CLIENT_CODE     = process.env.PARAM_CLIENT_CODE;
const CLIENT_USERNAME = process.env.PARAM_CLIENT_USERNAME;
const CLIENT_PASSWORD = process.env.PARAM_CLIENT_PASSWORD;
const GUID            = process.env.PARAM_GUID;
const PUBLIC_URL      = process.env.PUBLIC_URL || 'https://bizebivilla.com';

// Test ve production endpoint'leri (Param dokümantasyonundan)
const SOAP_ENDPOINTS = {
  test:       'https://test-pos.param.com.tr/turkpos.ws/service_turkpos_test.asmx',
  production: 'https://pos.param.com.tr/turkpos.ws/service_turkpos.asmx',
};

const SOAP_URL = SOAP_ENDPOINTS[ENV];

// ── Yardımcılar ──────────────────────────────────────────────────

/**
 * Tutarı Param formatına çevirir: "1234.56" → "1234,56"
 * Param virgüllü kuruş formatı bekliyor.
 */
function formatAmount(amount) {
  const fixed = Number(amount).toFixed(2);
  return fixed.replace('.', ',');
}

/**
 * Sipariş için tekil bir ID üretir.
 * Format: BBV-{timestamp}-{random}
 */
function generateOrderId(inquiryId) {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BBV-${ts}-${rand}`;
}

/**
 * Param SHA2B64 imzası
 * Formül: SHA2B64(CLIENT_CODE + GUID + Taksit + Islem_Tutar + Toplam_Tutar + Siparis_ID)
 * Param dokümantasyonunda tarif edilen şekilde
 */
function generateHash(params) {
  const hashString =
    CLIENT_CODE +
    GUID +
    params.Taksit +
    params.Islem_Tutar +
    params.Toplam_Tutar +
    params.Siparis_ID;
  
  return crypto.createHash('sha256').update(hashString, 'utf8').digest('base64');
}

/**
 * XML special karakterleri escape et
 */
function xmlEscape(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Basit XML parse — Param'ın SOAP response'undan değer çekme
 * (xml2js kütüphanesi olmadan, basit regex ile)
 */
function extractXmlValue(xml, tagName) {
  const re = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(re);
  return match ? match[1].trim() : null;
}

// ── Ana fonksiyon: TP_Islem_Odeme ─────────────────────────────────

/**
 * Param'a 3D Secure ödeme başlatma isteği gönderir.
 * Başarılı olursa UCD_URL döner — bu URL'e yönlendirilir.
 *
 * @param {Object} params
 * @param {Object} params.card - Kart bilgileri (kart no, ay, yıl, cvv, isim soyisim)
 * @param {number} params.amount - Tutar (TL, ondalıklı, örn. 8500.00)
 * @param {string} params.orderId - Bizim ürettiğimiz unique Siparis_ID
 * @param {Object} params.guest - Misafir bilgileri (email, phone)
 * @param {string} params.successUrl - Başarılı callback URL'i
 * @param {string} params.failureUrl - Hatalı callback URL'i
 * @returns {Object} { success, ucdUrl, transactionId, raw }
 */
async function initPayment({ card, amount, orderId, guest, successUrl, failureUrl }) {
  if (!CLIENT_CODE || !GUID) {
    return { success: false, error: 'Param ortam değişkenleri eksik. PARAM_CLIENT_CODE ve PARAM_GUID tanımlı olmalı.' };
  }

  const formattedAmount = formatAmount(amount);
  const taksit = '1'; // Tek çekim
  
  // Hash hesapla
  const hashInput = {
    Taksit: taksit,
    Islem_Tutar: formattedAmount,
    Toplam_Tutar: formattedAmount,
    Siparis_ID: orderId,
  };
  const hash = generateHash(hashInput);

  // SOAP request body — TP_Islem_Odeme
  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <TP_Islem_Odeme xmlns="https://turkpos.com.tr/">
      <G>
        <CLIENT_CODE>${CLIENT_CODE}</CLIENT_CODE>
        <CLIENT_USERNAME>${CLIENT_USERNAME}</CLIENT_USERNAME>
        <CLIENT_PASSWORD>${CLIENT_PASSWORD}</CLIENT_PASSWORD>
      </G>
      <GUID>${GUID}</GUID>
      <KK_Sahibi>${xmlEscape(card.holderName)}</KK_Sahibi>
      <KK_No>${xmlEscape(card.number)}</KK_No>
      <KK_SK_Ay>${xmlEscape(card.expMonth)}</KK_SK_Ay>
      <KK_SK_Yil>${xmlEscape(card.expYear)}</KK_SK_Yil>
      <KK_CVC>${xmlEscape(card.cvc)}</KK_CVC>
      <KK_Sahibi_GSM>${xmlEscape(guest.phone || '')}</KK_Sahibi_GSM>
      <Hata_URL>${xmlEscape(failureUrl)}</Hata_URL>
      <Basarili_URL>${xmlEscape(successUrl)}</Basarili_URL>
      <Siparis_ID>${xmlEscape(orderId)}</Siparis_ID>
      <Siparis_Aciklama>bizebivilla villa rezervasyon kaporasi</Siparis_Aciklama>
      <Taksit>${taksit}</Taksit>
      <Islem_Tutar>${formattedAmount}</Islem_Tutar>
      <Toplam_Tutar>${formattedAmount}</Toplam_Tutar>
      <Islem_Hash>${hash}</Islem_Hash>
      <Islem_Guvenlik_Tip>3D</Islem_Guvenlik_Tip>
      <Islem_ID></Islem_ID>
      <IPAdr>${xmlEscape(guest.ip || '')}</IPAdr>
      <Ref_URL>${xmlEscape(PUBLIC_URL)}</Ref_URL>
      <Data1></Data1>
      <Data2></Data2>
      <Data3></Data3>
      <Data4></Data4>
      <Data5></Data5>
    </TP_Islem_Odeme>
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await fetch(SOAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'https://turkpos.com.tr/TP_Islem_Odeme',
      },
      body: soapBody,
    });

    const xmlText = await response.text();

    // SOAP fault var mı kontrol et
    if (xmlText.includes('<soap:Fault>') || xmlText.includes('<faultstring>')) {
      const faultStr = extractXmlValue(xmlText, 'faultstring') || 'SOAP fault';
      console.error('Param SOAP fault:', faultStr);
      return { success: false, error: `Param SOAP fault: ${faultStr}`, raw: xmlText };
    }

    const sonuc       = extractXmlValue(xmlText, 'Sonuc');
    const sonucStr    = extractXmlValue(xmlText, 'Sonuc_Str');
    const islemId     = extractXmlValue(xmlText, 'Islem_ID');
    const ucdUrl      = extractXmlValue(xmlText, 'UCD_URL');

    if (!sonuc || Number(sonuc) <= 0) {
      console.error('Param initPayment başarısız:', { sonuc, sonucStr });
      return {
        success: false,
        error: sonucStr || 'Param ödeme başlatma başarısız',
        sonuc,
        raw: xmlText,
      };
    }

    if (!ucdUrl || ucdUrl === 'NONSECURE') {
      return {
        success: false,
        error: '3D URL alınamadı (NONSECURE döndü, beklemiyorduk)',
        raw: xmlText,
      };
    }

    return {
      success: true,
      ucdUrl,
      transactionId: islemId,
      sonuc,
      sonucStr,
    };
  } catch (err) {
    console.error('Param initPayment hata:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Param callback'inden gelen form verilerini parse eder.
 * Param, Basarili_URL veya Hata_URL'e application/x-www-form-urlencoded POST yapar.
 * Beklenen alanlar (dokümantasyon "Hata_URL ve Basarili_URL POST Parametreleri"):
 *   - TURKPOS_RETVAL_Sonuc: Sonuç kodu (>0 = başarılı)
 *   - TURKPOS_RETVAL_Sonuc_Str: Açıklama
 *   - TURKPOS_RETVAL_Dekont_ID: Dekont numarası
 *   - TURKPOS_RETVAL_Tahsilat_Tutari: Tahsil edilen tutar
 *   - TURKPOS_RETVAL_Siparis_ID: Bizim verdiğimiz Siparis_ID
 *   - TURKPOS_RETVAL_Islem_ID: Param işlem ID
 *   - TURKPOS_RETVAL_Banka_Sonuc_Kod: Banka kodu
 *   - mdStatus: 3D doğrulama durumu (1,2,3,4 = ok / 0,5,6,7,8 = fail)
 */
function parseCallback(body) {
  const sonucCode = body.TURKPOS_RETVAL_Sonuc;
  const sonucStr  = body.TURKPOS_RETVAL_Sonuc_Str || body.TURKPOS_RETVAL_Sonuc_Aciklama;
  const orderId   = body.TURKPOS_RETVAL_Siparis_ID;
  const islemId   = body.TURKPOS_RETVAL_Islem_ID;
  const dekontId  = body.TURKPOS_RETVAL_Dekont_ID;
  const amount    = body.TURKPOS_RETVAL_Tahsilat_Tutari;
  const mdStatus  = body.mdStatus;

  const isSuccess = Number(sonucCode) > 0;

  return {
    success: isSuccess,
    orderId,
    transactionId: islemId,
    dekontId,
    amount,
    sonucCode,
    sonucStr,
    mdStatus,
    raw: body,
  };
}

module.exports = {
  initPayment,
  parseCallback,
  generateOrderId,
  formatAmount,
};
