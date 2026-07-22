/**
 * @module normalization.service
 * @description Normalizes raw product data from any provider into the unified schema.
 *
 * Phase 2 upgrades:
 *  - Raw offer/description text is now piped through extractOffers() to extract
 *    structured bank/coupon/cashback values automatically
 *  - Better finalPayablePrice calculation using extracted offer values
 */

const { calculateFinalPrice } = require('./pricing.service');
const { extractOffers } = require('./offerExtractor');
const { safeNumber } = require('../utils/helpers');
const { getAllBrands, normalizeBrand } = require('../config/brandRegistry');

const MARKETPLACE_BRANDS = new Set([
  'amazon',
  'flipkart',
  'croma',
  'reliance digital',
  'vijay sales',
  'vijaysales',
  'myntra',
  'ajio',
  'meesho',
  'nykaa',
  'purplle',
  'tira',
  'apollo',
  'pharmeasy',
  'tata 1mg',
  'netmeds'
]);

function normaliseOfferText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function inferOffers(rawProduct, { shipping, bankOffer, couponDiscount, cashback, exchangeBonus, emiDiscount }) {
  const explicitOffers = Array.isArray(rawProduct.offers)
    ? rawProduct.offers.map(normaliseOfferText).filter(Boolean)
    : [];

  const text = normaliseOfferText([
    rawProduct.offer,
    rawProduct.offerText,
    rawProduct.description,
    rawProduct.delivery
  ].filter(Boolean).join(' '));

  const inferred = [];
  if (bankOffer > 0) inferred.push(`Bank offer up to ₹${bankOffer}`);
  if (couponDiscount > 0) inferred.push(`Coupon discount up to ₹${couponDiscount}`);
  if (cashback > 0) inferred.push(`Cashback up to ₹${cashback}`);
  if (exchangeBonus > 0) inferred.push(`Exchange bonus up to ₹${exchangeBonus}`);
  if (emiDiscount > 0) inferred.push(`No cost EMI available`);
  if (shipping === 0 && /free delivery|free shipping/i.test(text)) inferred.push('Free delivery');
  if (/cashback/i.test(text) && cashback === 0) inferred.push('Cashback available');
  if (/coupon|apply/i.test(text) && couponDiscount === 0) inferred.push('Coupon available');
  if (/(hdfc|sbi|icici|axis|kotak|bank)/i.test(text) && bankOffer === 0) inferred.push('Bank offer available');
  if (/emi/i.test(text) && emiDiscount === 0) inferred.push('EMI option available');
  if (/exchange/i.test(text) && exchangeBonus === 0) inferred.push('Exchange offer available');
  if (/first order|new user/i.test(text)) inferred.push('First order offer available');
  if (/free installation/i.test(text)) inferred.push('Free installation included');
  if (/upi.*offer|offer.*upi/i.test(text)) inferred.push('UPI payment offer');

  return [...new Set([...explicitOffers, ...inferred])].slice(0, 8);
}

function calculateDiscountPercentage(currentPrice, originalPrice) {
  if (!originalPrice || originalPrice <= currentPrice) {
    return 0;
  }

  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

function stableProductId(rawProduct, platform) {
  const basis = [
    rawProduct.productId,
    rawProduct.id,
    rawProduct.productUrl,
    rawProduct.productURL,
    rawProduct.url,
    rawProduct.productName,
    rawProduct.title,
    rawProduct.name
  ].find(Boolean);

  const slug = String(basis || `${platform}-${Date.now()}-${Math.random()}`)
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  return `${platform}-${slug || Date.now()}`;
}

function normalizedBrandKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferBrandFromTitle(title) {
  const productTitle = normalizedBrandKey(title);
  if (!productTitle) return '';

  return getAllBrands()
    .map((brand) => ({ brand: normalizeBrand(brand), key: normalizedBrandKey(brand) }))
    .sort((a, b) => b.key.length - a.key.length)
    .find(({ key }) => new RegExp(`(^|\\s)${escapeRegex(key)}(\\s|$)`, 'i').test(productTitle))
    ?.brand || '';
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeProductBrand(rawBrand, productName, platform) {
  const brand = normalizeBrand(rawBrand || '');
  const key = normalizedBrandKey(brand);
  const platformKey = normalizedBrandKey(platform);

  if (!brand || MARKETPLACE_BRANDS.has(key) || key === platformKey) {
    return inferBrandFromTitle(productName);
  }

  return brand;
}

function normalizeProduct(rawProduct, platform, source = 'api') {
  // ── Phase 2: Extract structured offers from raw description/offer text ──────
  const rawOfferText = [
    rawProduct.description,
    rawProduct.offer,
    rawProduct.offerText,
    rawProduct.delivery,
    rawProduct.bankOffer > 0 ? `Bank offer ₹${rawProduct.bankOffer}` : ''
  ].filter(Boolean).join(' ');

  const extracted = rawOfferText.length > 5 ? extractOffers(rawOfferText) : {
    bankOffer: 0, couponDiscount: 0, cashback: 0, exchangeBonus: 0, emiDiscount: 0, shipping: -1, offers: []
  };

  const listingPrice = safeNumber(
    rawProduct.currentPrice ||
    rawProduct.price ||
    rawProduct.productPrice ||
    calculateFinalPrice(rawProduct)
  );

  const gst = safeNumber(rawProduct.gst);

  // Use extracted shipping if raw product has no explicit shipping info
  const rawShipping = rawProduct.shipping;
  const shipping = rawShipping !== undefined && rawShipping !== null
    ? safeNumber(rawShipping)
    : (extracted.shipping === 0 ? 0 : 0);  // default 0, real shipping added later

  // Prefer explicitly provided offer values; fall back to extracted
  const bankOffer      = safeNumber(rawProduct.bankOffer)      || extracted.bankOffer;
  const couponDiscount = safeNumber(rawProduct.couponDiscount) || extracted.couponDiscount;
  const cashback       = safeNumber(rawProduct.cashback)       || extracted.cashback;
  const walletOffer    = safeNumber(rawProduct.walletOffer);
  const exchangeBonus  = safeNumber(rawProduct.exchangeBonus)  || extracted.exchangeBonus;
  const emiDiscount    = safeNumber(rawProduct.emiDiscount)    || extracted.emiDiscount;
  const installation   = safeNumber(rawProduct.installation);

  const totalSavings = bankOffer + couponDiscount + cashback + walletOffer + exchangeBonus + emiDiscount;

  const finalPayablePrice = safeNumber(
    rawProduct.finalPayablePrice,
    Math.max(0, listingPrice + gst + shipping + installation - bankOffer - couponDiscount - cashback - walletOffer - exchangeBonus - emiDiscount)
  );

  const originalPrice = safeNumber(
    rawProduct.originalPrice ||
    rawProduct.mrp ||
    rawProduct.productPrice ||
    listingPrice
  );

  const productName = rawProduct.productName || rawProduct.title || rawProduct.name || '';
  const brand = normalizeProductBrand(rawProduct.brand, productName, platform);

  return {
    platform,
    productId: stableProductId(rawProduct, platform),
    productName,
    brand,
    category: rawProduct.category || '',
    description: rawProduct.description || `${brand || platform} ${rawProduct.title || rawProduct.productName || ''}`.trim(),
    currentPrice: listingPrice,
    originalPrice,
    gst,
    shipping,
    installation,
    bankOffer,
    couponDiscount,
    cashback,
    walletOffer,
    exchangeBonus,
    emiDiscount,
    totalSavings,
    finalPayablePrice,
    offers: inferOffers(rawProduct, { shipping, bankOffer, couponDiscount, cashback, exchangeBonus, emiDiscount }),
    discountPercentage: safeNumber(
      rawProduct.discountPercentage ||
      rawProduct.discount ||
      (listingPrice ? Math.round((totalSavings / listingPrice) * 100) : calculateDiscountPercentage(listingPrice, originalPrice))
    ),
    rating: safeNumber(rawProduct.rating, 4.2),
    reviewCount: safeNumber(rawProduct.reviewCount || rawProduct.reviews, 120),
    image: rawProduct.image || rawProduct.imageUrl || '',
    productUrl: rawProduct.productUrl || rawProduct.productURL || rawProduct.url || '',
    availability: rawProduct.availability !== false,
    source,
    fetchedAt: new Date().toISOString()
  };
}

module.exports = {
  normalizeProduct
};
