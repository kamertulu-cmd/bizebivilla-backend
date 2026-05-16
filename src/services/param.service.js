// src/services/param.service.js
// Param POS Servisi — Pos_Odeme metodu ile 3D Secure ödeme
//
// Dokümantasyon: https://dev.param.com.tr/tr/api/odeme
// Akış:
//   1. Param'a SHA2B64 hash isteği gönder (CLIENT_CODE+GUID+Taksit+Tutar+Tutar+OrderId+FailUrl+SuccessUrl)
//   2. Hash dönünce Pos_Odeme metoduna 3D Secure isteği gönder
//   3. Param UCD_URL döner — bu URL'e kullanıcı yönlendirilir, banka 3D sayfasına gider
//   4. 3D onayından sonra Param Basarili_URL veya Hata_URL'e POST eder (callback)

// ── Ortam değişkenleri ────────────────────────────────────────────
const ENV = process.env.PARAM_ENV || 'test';
const CLIENT_CODE     = process.env.PARAM_CLIENT_CODE;
const CLIENT_USERNAME = process.env.PARAM_CLIENT_USERNAME;
const CLIENT_PASSWORD = process.env.PARAM_CLIENT_PASSWORD;
const GUID            = process.env.PARAM_GUID;
const PUBLIC_URL      = process.env.PUBLIC_URL || 'https://bizebivilla.com';

// Doğru endpoint URL'leri (parampos npm paketinden teyit edildi)
const SOAP_ENDPOINTS = {
  test:       'https://test-dmz.param.com.tr:4443/turkpos.ws/service_turkpos_test.asmx',
  production: 'https://dmzws.ew.com.tr/turkpos.ws/service_turkpos_prod.asmx',
};

const SOAP_URL = SOAP_ENDPOINTS[ENV];

// ── Yardımcılar ──────────────────────────────────────────────────

function formatAmount(amount) {
  return Number(amount).toFixed(2).replace('.', ',');
}

function generateOrderId() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BBV-${ts}-${rand}`;
}

function xmlEscape(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractXmlValue(xml, tagName) {
  const re = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(re);
  return match ? match[1].trim() : null;
}

// ── 1. Adım: Param'dan SHA2B64 hash al ───────────────────────────
async function getHashFromParam(securityString) {
  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SHA2B64 xmlns="https://turkpos.com.tr/">
      <Data>${xmlEscape(securityString)}</Data>
    </SHA2B64>
  </soap:Body>
</soap:Envelope>`;

  const response = await fetch(SOAP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': 'https://turkpos.com.tr/SHA2B64',
    },
    body: soapBody,
  });

  const xmlText = await response.text();
  const hash = extractXmlValue(xmlText, 'SHA2B64Result');

  if (!hash) {
    console.error('Hash alinamadi. HTTP:', response.status);
    console.error('Ham cevap (ilk 500):', xmlText.substring(0, 500));
    throw new Error('Param hash servisi cevap vermedi');
  }

  return hash;
}

// ── 2. Adım: Pos_Odeme ile 3D Secure ödeme başlat ────────────────
async function initPayment({ card, amount, orderId, guest, successUrl, failureUrl }) {
  if (!CLIENT_CODE || !GUID) {
    return { success: false, error: 'Param ortam degiskenleri eksik (PARAM_CLIENT_CODE / PARAM_GUID).' };
  }

  const formattedAmount = formatAmount(amount);
  const taksit = '1';

  const securityString =
    CLIENT_CODE + GUID + taksit + formattedAmount + formattedAmount +
    orderId + failureUrl + successUrl;

  let hash;
  try {
    hash = await getHashFromParam(securityString);
  } catch (e) {
    return { success: false, error: 'Param hash alinamadi: ' + e.message };
  }

  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Pos_Odeme xmlns="https://turkpos.com.tr/">
      <G>
        <CLIENT_CODE>${xmlEscape(CLIENT_CODE)}</CLIENT_CODE>
        <CLIENT_USERNAME>${xmlEscape(CLIENT_USERNAME)}</CLIENT_USERNAME>
        <CLIENT_PASSWORD>${xmlEscape(CLIENT_PASSWORD)}</CLIENT_PASSWORD>
      </G>
      <GUID>${xmlEscape(GUID)}</GUID>
      <KK_Sahibi>${xmlEscape(card.holderName)}</KK_Sahibi>
      <KK_No>${xmlEscape(card.number)}</KK_No>
      <KK_SK_Ay>${xmlEscape(card.expMonth)}</KK_SK_Ay>
      <KK_SK_Yil>${xmlEscape(card.expYear)}</KK_SK_Yil>
      <KK_CVC>${xmlEscape(card.cvc)}</KK_CVC>
      <KK_Sahibi_GSM>${xmlEscape(guest.phone || '5555555555')}</KK_Sahibi_GSM>
      <Hata_URL>${xmlEscape(failureUrl)}</Hata_URL>
      <Basarili_URL>${xmlEscape(successUrl)}</Basarili_URL>
      <Siparis_ID>${xmlEscape(orderId)}</Siparis_ID>
      <Siparis_Aciklama>bizebivilla villa rezervasyon kaporasi</Siparis_Aciklama>
      <Taksit>${taksit}</Taksit>
      <Islem_Tutar>${formattedAmount}</Islem_Tutar>
      <Toplam_Tutar>${formattedAmount}</Toplam_Tutar>
      <Islem_Hash>${xmlEscape(hash)}</Islem_Hash>
      <Islem_Guvenlik_Tip>3D</Islem_Guvenlik_Tip>
      <Islem_ID></Islem_ID>
      <IPAdr>${xmlEscape(guest.ip || '127.0.0.1')}</IPAdr>
      <Ref_URL>${xmlEscape(PUBLIC_URL)}</Ref_URL>
      <Data1></Data1>
      <Data2></Data2>
      <Data3></Data3>
      <Data4></Data4>
      <Data5></Data5>
      <Data6></Data6>
      <Data7></Data7>
      <Data8></Data8>
      <Data9></Data9>
      <Data10></Data10>
    </Pos_Odeme>
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await fetch(SOAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'https://turkpos.com.tr/Pos_Odeme',
      },
      body: soapBody,
    });

    const xmlText = await response.text();

    console.log('Pos_Odeme HTTP status:', response.status);
    console.log('Pos_Odeme ham cevap (ilk 1500):', xmlText.substring(0, 1500));

    if (xmlText.includes('<soap:Fault>') || xmlText.includes('<faultstring>')) {
      const faultStr = extractXmlValue(xmlText, 'faultstring') || 'SOAP fault';
      return { success: false, error: 'Param SOAP fault: ' + faultStr, raw: xmlText };
    }

    const sonuc    = extractXmlValue(xmlText, 'Sonuc');
    const sonucStr = extractXmlValue(xmlText, 'Sonuc_Str');
    const islemId  = extractXmlValue(xmlText, 'Islem_ID');
    const ucdUrl   = extractXmlValue(xmlText, 'UCD_URL');
    const bankaKod = extractXmlValue(xmlText, 'Banka_Sonuc_Kod');

    if (!sonuc || Number(sonuc) <= 0) {
      console.error('Pos_Odeme basarisiz:', { sonuc, sonucStr, bankaKod });
      return {
        success: false,
        error: sonucStr || 'Param odeme baslatma basarisiz',
        sonuc, bankaKod,
        raw: xmlText,
      };
    }

    if (!ucdUrl || ucdUrl === 'NONSECURE') {
      return {
        success: false,
        error: '3D URL alinamadi (NONSECURE dondu, 3D bekliyorduk)',
        raw: xmlText,
      };
    }

    return {
      success: true,
      ucdUrl,
      transactionId: islemId,
      sonuc, sonucStr,
    };
  } catch (err) {
    console.error('Pos_Odeme network hata:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Callback parse ───────────────────────────────────────────────
function parseCallback(body) {
  const sonucCode = body.TURKPOS_RETVAL_Sonuc;
  const sonucStr  = body.TURKPOS_RETVAL_Sonuc_Str;
  const orderId   = body.TURKPOS_RETVAL_Siparis_ID;
  const islemId   = body.TURKPOS_RETVAL_Islem_ID;
  const dekontId  = body.TURKPOS_RETVAL_Dekont_ID;
  const amount    = body.TURKPOS_RETVAL_Tahsilat_Tutari;
  const bankaKod  = body.TURKPOS_RETVAL_Banka_Sonuc_Kod;

  const isSuccess = Number(sonucCode) > 0 && Number(dekontId) > 0;

  return {
    success: isSuccess,
    orderId,
    transactionId: islemId,
    dekontId,
    amount,
    sonucCode, sonucStr, bankaKod,
    raw: body,
  };
}

module.exports = {
  initPayment,
  parseCallback,
  generateOrderId,
  formatAmount,
};
