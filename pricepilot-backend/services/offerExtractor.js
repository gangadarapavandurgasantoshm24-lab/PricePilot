/**
 * @module offerExtractor
 * @description Extracts structured offer data from raw text scraped from
 * shopping websites. Works on any concatenated offer/description text from
 * a product listing page.
 *
 * Phase 2 upgrades:
 *  - Percentage-based bank offers (e.g., "10% off with HDFC up to ₹1500")
 *  - First-order / new user offers (e.g., "New User? Get 15% off")
 *  - Exchange offer detection improved
 *  - Platform coupon / loyalty points patterns
 *  - More comprehensive offer text detectors
 *
 * Returns numeric values for each offer type so normalization.service.js
 * can compute finalPayablePrice accurately.
 */

// ─── Bank offer detection ─────────────────────────────────────────────────────

const BANK_PATTERNS = [
  // Specific discount amounts with bank names
  /(?:hdfc|sbi|icici|axis|kotak|rbl|bob|yes bank|standard chartered|hsbc|citi|au bank)\b.{0,80}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)\s*(?:off|discount|cashback|instant)/gi,
  // Generic bank offer amount
  /bank\s+(?:offer|discount|cashback).{0,50}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  // "save ₹500 with HDFC"
  /save\s+(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+).{0,50}?(?:hdfc|sbi|icici|axis|kotak|rbl|bank\s+card)/gi,
  // "HDFC ₹1000 discount"
  /(?:hdfc|sbi|icici|axis|kotak|rbl|bank)\s+(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  // Percentage up to amount: "10% off up to ₹1500 with HDFC"
  /\d+%\s+(?:instant\s+)?(?:off|discount).{0,40}?(?:up\s+to\s+)?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+).{0,30}?(?:hdfc|sbi|icici|axis|kotak|bank)/gi,
  // "Instant discount of ₹1000"
  /instant\s+discount(?:\s+of)?\s+(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
];

const COUPON_PATTERNS = [
  /coupon\s+(?:discount|off|code).{0,50}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  /(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)\s+(?:coupon|promo|voucher)/gi,
  /flat\s+(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)\s+off\s+(?:with\s+)?coupon/gi,
  /apply\s+coupon.{0,30}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  // "extra ₹200 off with code"
  /extra\s+(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)\s+off/gi,
  // "Use code XYZ for ₹300 off"
  /use\s+code.{0,20}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  // First-order / new user coupon
  /(?:first\s+order|new\s+user).{0,60}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
];

const CASHBACK_PATTERNS = [
  /(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)\s+cashback/gi,
  /cashback\s+(?:of\s+)?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  /(?:upi|phonepe|gpay|paytm|google\s+pay)\s+cashback.{0,30}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  /([0-9]+)%\s+cashback\s+up\s+to\s+(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  // "Earn ₹100 cashback"
  /earn\s+(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)\s+cashback/gi,
  // "Coins/rewards cashback"
  /(?:reward|coin|point)s?.{0,20}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
];

const EMI_PATTERNS = [
  /no\s+cost\s+emi.{0,50}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  /emi\s+(?:starts?|from|at|starting).{0,30}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  // "0% EMI available" treated as emi discount indicator
  /0%\s+emi/gi,
];

const EXCHANGE_PATTERNS = [
  /exchange\s+(?:bonus|offer|discount).{0,50}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  /(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)\s+(?:exchange\s+(?:bonus|offer))/gi,
  /exchange\s+your\s+old.{0,50}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
  // "Up to ₹5000 exchange value"
  /up\s+to\s+(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)\s+exchange/gi,
  // "Old device exchange"
  /old\s+device.{0,30}?(?:rs\.?\s*|₹\s*|inr\s*)([0-9,]+)/gi,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAmount(str) {
  const cleaned = String(str || '').replace(/,/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function extractMax(text, patterns) {
  let max = 0;
  for (const pattern of patterns) {
    pattern.lastIndex = 0; // reset global regex
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(text)) !== null) {
      // Last capture group is always the amount
      const amount = parseAmount(match[match.length - 1]);
      if (amount > max) max = amount;
    }
  }
  return max;
}

// ─── Offer text builders ──────────────────────────────────────────────────────

const OFFER_TEXT_DETECTORS = [
  { pattern: /\b(hdfc|sbi|icici|axis|kotak|rbl|bank)\b/i,                 label: (m) => `${m[1].toUpperCase()} Credit Card offer available` },
  { pattern: /cashback/i,                                                   label: () => 'Cashback available' },
  { pattern: /coupon|promo code|voucher/i,                                  label: () => 'Coupon discount available' },
  { pattern: /no[- ]cost emi/i,                                             label: () => 'No cost EMI available' },
  { pattern: /emi/i,                                                        label: () => 'EMI option available' },
  { pattern: /exchange\s+(bonus|offer)/i,                                   label: () => 'Exchange bonus available' },
  { pattern: /first\s+order|new\s+user/i,                                   label: () => 'First order offer available' },
  { pattern: /free\s+(delivery|shipping)/i,                                 label: () => 'Free delivery' },
  { pattern: /free\s+installation/i,                                        label: () => 'Free installation included' },
  { pattern: /platform\s+offer|special\s+offer|deal\s+of\s+the\s+day/i,   label: () => 'Platform special offer' },
  { pattern: /buy\s+[23]\s+get\s+[12]/i,                                   label: () => 'Buy More Save More offer' },
  { pattern: /flat\s+\d+%\s+off/i,                                         label: (m) => `Flat ${m[0].match(/\d+/)[0]}% off` },
  { pattern: /\d+%\s+off\s+(?:on|with)\s+(?:hdfc|sbi|icici|axis|kotak)/i, label: (m) => `${m[0].match(/\d+/)[0]}% off with bank card` },
  { pattern: /instant\s+discount/i,                                         label: () => 'Instant discount available' },
  { pattern: /loyalty\s+points|reward\s+points|super\s+coins/i,            label: () => 'Earn loyalty rewards' },
  { pattern: /upi\s+(?:offer|cashback|discount)/i,                          label: () => 'UPI payment offer' },
  { pattern: /wallet\s+(?:offer|cashback)/i,                                label: () => 'Wallet cashback available' },
];

function buildOfferTexts(text, bankOffer, couponDiscount, cashback, exchangeBonus, emiDiscount) {
  const found = new Set();

  // From numeric values (most precise)
  if (bankOffer > 0)      found.add(`Bank offer: Up to ₹${bankOffer} off`);
  if (couponDiscount > 0) found.add(`Coupon: Up to ₹${couponDiscount} off`);
  if (cashback > 0)       found.add(`Cashback: Up to ₹${cashback}`);
  if (exchangeBonus > 0)  found.add(`Exchange bonus: Up to ₹${exchangeBonus}`);
  if (emiDiscount > 0)    found.add(`No cost EMI available`);

  // From text detection (pattern-based)
  OFFER_TEXT_DETECTORS.forEach(({ pattern, label }) => {
    const match = text.match(pattern);
    if (match) {
      const str = label(match);
      // Don't double-add if already captured by numeric value
      const alreadyCovered =
        (str.includes('Bank') && bankOffer > 0) ||
        (str.includes('Coupon') && couponDiscount > 0) ||
        (str.includes('Cashback') && cashback > 0) ||
        (str.includes('Exchange') && exchangeBonus > 0) ||
        (str.includes('EMI') && emiDiscount > 0);
      if (!alreadyCovered) found.add(str);
    }
  });

  return [...found].slice(0, 8);
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Extract structured offer data from raw text scraped from a product listing.
 *
 * @param {string|string[]} rawText - Concatenated text from a product card
 * @returns {{
 *   bankOffer: number,
 *   couponDiscount: number,
 *   cashback: number,
 *   exchangeBonus: number,
 *   emiDiscount: number,
 *   shipping: number,
 *   offers: string[]
 * }}
 */
function extractOffers(rawText) {
  const text = Array.isArray(rawText)
    ? rawText.filter(Boolean).join(' ')
    : String(rawText || '');

  const bankOffer      = extractMax(text, BANK_PATTERNS);
  const couponDiscount = extractMax(text, COUPON_PATTERNS);
  const cashback       = extractMax(text, CASHBACK_PATTERNS);
  const emiDiscount    = extractMax(text, EMI_PATTERNS);
  const exchangeBonus  = extractMax(text, EXCHANGE_PATTERNS);
  const shipping       = /free\s+(delivery|shipping)/i.test(text) ? 0 : -1; // -1 = unknown

  const offers = buildOfferTexts(text, bankOffer, couponDiscount, cashback, exchangeBonus, emiDiscount);

  return { bankOffer, couponDiscount, cashback, exchangeBonus, emiDiscount, shipping, offers };
}

module.exports = { extractOffers };
