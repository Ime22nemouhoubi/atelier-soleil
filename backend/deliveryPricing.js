// deliveryPricing.js — ZR Express delivery prices per wilaya
// Source: ZR Express pricing sheet (TARIF 01).
// 0 = unavailable (customer must contact the store).
// Blida (9) is the origin wilaya → local delivery, both options free.
// FREE_DELIVERY_THRESHOLD: if subtotal >= threshold, fee is 0 regardless.

const FREE_DELIVERY_THRESHOLD = 10000; // DA

// Keyed by French wilaya name (must match frontend wilayas.js first column).
const DELIVERY_PRICES = {
  'Adrar':              { home: 1400, stopdesk: 970 },
  'Chlef':              { home: 750,  stopdesk: 520 },
  'Laghouat':           { home: 950,  stopdesk: 670 },
  'Oum El Bouaghi':     { home: 800,  stopdesk: 520 },
  'Batna':              { home: 800,  stopdesk: 520 },
  'Béjaïa':             { home: 800,  stopdesk: 520 },
  'Biskra':             { home: 950,  stopdesk: 670 },
  'Béchar':             { home: 1100, stopdesk: 720 },
  'Blida':              { home: 0,    stopdesk: 0   }, // local
  'Bouira':             { home: 750,  stopdesk: 520 },
  'Tamanrasset':        { home: 1600, stopdesk: 1120 },
  'Tébessa':            { home: 850,  stopdesk: 520 },
  'Tlemcen':            { home: 850,  stopdesk: 570 },
  'Tiaret':             { home: 800,  stopdesk: 520 },
  'Tizi Ouzou':         { home: 750,  stopdesk: 520 },
  'Alger':              { home: 500,  stopdesk: 420 },
  'Djelfa':             { home: 950,  stopdesk: 670 },
  'Jijel':              { home: 800,  stopdesk: 520 },
  'Sétif':              { home: 750,  stopdesk: 520 },
  'Saïda':              { home: 800,  stopdesk: 570 },
  'Skikda':             { home: 800,  stopdesk: 520 },
  'Sidi Bel Abbès':     { home: 800,  stopdesk: 520 },
  'Annaba':             { home: 800,  stopdesk: 520 },
  'Guelma':             { home: 800,  stopdesk: 520 },
  'Constantine':        { home: 800,  stopdesk: 520 },
  'Médéa':              { home: 750,  stopdesk: 520 },
  'Mostaganem':         { home: 800,  stopdesk: 520 },
  "M'Sila":             { home: 850,  stopdesk: 570 },
  'Mascara':            { home: 800,  stopdesk: 520 },
  'Ouargla':            { home: 950,  stopdesk: 670 },
  'Oran':               { home: 800,  stopdesk: 520 },
  'El Bayadh':          { home: 1100, stopdesk: 670 },
  'Illizi':             { home: 0,    stopdesk: 0   }, // unavailable
  'Bordj Bou Arréridj': { home: 750,  stopdesk: 520 },
  'Boumerdès':          { home: 750,  stopdesk: 520 },
  'El Tarf':            { home: 800,  stopdesk: 520 },
  'Tindouf':            { home: 0,    stopdesk: 0   }, // unavailable
  'Tissemsilt':         { home: 800,  stopdesk: 520 },
  'El Oued':            { home: 950,  stopdesk: 670 },
  'Khenchela':          { home: 800,  stopdesk: 450 },
  'Souk Ahras':         { home: 800,  stopdesk: 520 },
  'Tipaza':             { home: 750,  stopdesk: 520 },
  'Mila':               { home: 800,  stopdesk: 520 },
  'Aïn Defla':          { home: 750,  stopdesk: 520 },
  'Naâma':              { home: 1100, stopdesk: 670 },
  'Aïn Témouchent':     { home: 800,  stopdesk: 520 },
  'Ghardaïa':           { home: 950,  stopdesk: 670 },
  'Relizane':           { home: 800,  stopdesk: 520 },
  'Timimoun':           { home: 1400, stopdesk: 970 },
  'Bordj Badji Mokhtar': { home: 0,   stopdesk: 0   }, // unavailable
  'Ouled Djellal':      { home: 950,  stopdesk: 670 },
  'Béni Abbès':         { home: 1000, stopdesk: 970 },
  'In Salah':           { home: 1600, stopdesk: 1120 },
  'In Guezzam':         { home: 0,    stopdesk: 1600 }, // home unavailable
  'Touggourt':          { home: 950,  stopdesk: 670 },
  'Djanet':             { home: 0,    stopdesk: 0   }, // unavailable
  "El M'Ghair":         { home: 0,    stopdesk: 950 }, // home unavailable
  'El Meniaa':          { home: 0,    stopdesk: 1000 }, // home unavailable
};

/**
 * Compute delivery fee for a given wilaya + delivery type + order subtotal.
 * Returns { fee, available } where `available` is false if that combination
 * has no price (e.g. home delivery to Illizi).
 */
function computeDeliveryFee(wilayaName, deliveryType, subtotal) {
  const prices = DELIVERY_PRICES[wilayaName];
  if (!prices) return { fee: 0, available: false };
  const rawFee = prices[deliveryType];
  // "0" here means unavailable OR local (Blida). Blida is a special case:
  // local delivery is free, still available.
  if (rawFee === 0 && wilayaName !== 'Blida') {
    return { fee: 0, available: false };
  }
  // Free delivery over threshold (Blida always free)
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return { fee: 0, available: true };
  return { fee: rawFee, available: true };
}

module.exports = { DELIVERY_PRICES, FREE_DELIVERY_THRESHOLD, computeDeliveryFee };
