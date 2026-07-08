/**
 * @module amazon.official
 * @description Amazon Product Advertising API v5 provider.
 *
 * Strategy: 'official-api'
 *
 * This provider calls the Amazon Product Advertising API v5 (PA API) to
 * retrieve real product data. It requires three environment variables:
 *   AMAZON_ACCESS_KEY   – PA API access key ID
 *   AMAZON_SECRET_KEY   – PA API secret access key
 *   AMAZON_PARTNER_TAG  – Associates / affiliate partner tag
 *
 * If any of these are missing, the provider transparently delegates all
 * calls to the mock provider and logs a warning. No crashes, no code
 * changes required — add credentials to .env to activate the real API.
 *
 * AWS Signature:
 *   PA API v5 uses AWS Signature Version 4 (SigV4). This implementation
 *   computes the canonical request, string-to-sign, and HMAC-SHA256
 *   signature using only Node.js built-ins (no aws-sdk required).
 *
 * API Reference:
 *   https://webservices.amazon.com/paapi5/documentation/
 *
 * Terms of Service:
 *   https://affiliate-program.amazon.com/help/operating/agreement
 *   Usage is governed by the Amazon Associates Program Operating Agreement.
 *   This provider only uses the SearchItems operation, which is explicitly
 *   provided for affiliate product discovery.
 */

const crypto       = require('crypto');
const { stringEnv } = require('../../config/env');
const httpClient   = require('../../services/httpClient');
const mockProvider = require('./amazon.mock');
const logger       = require('../../utils/logger');

// ─── Configuration ────────────────────────────────────────────────────────────

const ACCESS_KEY   = stringEnv('AMAZON_ACCESS_KEY',   '');
const SECRET_KEY   = stringEnv('AMAZON_SECRET_KEY',   '');
const PARTNER_TAG  = stringEnv('AMAZON_PARTNER_TAG',  '');
const MARKETPLACE  = stringEnv('AMAZON_MARKETPLACE',  'www.amazon.in');
const PA_REGION    = stringEnv('AMAZON_PA_API_REGION', 'eu-west-1');

const PA_HOST      = 'webservices.amazon.in';
const PA_PATH      = '/paapi5/searchitems';
const PA_SERVICE   = 'ProductAdvertisingAPI';
const PA_ENDPOINT  = `https://${PA_HOST}${PA_PATH}`;

/** Whether PA API credentials are fully configured. */
const credentialsConfigured =
  Boolean(ACCESS_KEY) && Boolean(SECRET_KEY) && Boolean(PARTNER_TAG);

// ─── Expose active strategy for factory logging ───────────────────────────────

/** Used by providerFactory.js to log which strategy is active. */
const _activeStrategy = credentialsConfigured ? 'official-api' : 'mock-fallback';

if (!credentialsConfigured) {
  logger.warn('Amazon PA API Credentials Missing – Using Mock Fallback', {
    hint: 'Set AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG in .env to use the real API'
  });
}

// ─── AWS Signature v4 helpers ─────────────────────────────────────────────────

/**
 * Create an HMAC-SHA256 signature.
 *
 * @param {string|Buffer} key
 * @param {string} data
 * @returns {Buffer}
 */
function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

/**
 * Create a SHA-256 hex digest.
 *
 * @param {string} data
 * @returns {string}
 */
function hash(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Derive the AWS signing key for a given date/region/service.
 *
 * @param {string} secretKey
 * @param {string} dateStamp  - YYYYMMDD
 * @param {string} region
 * @param {string} service
 * @returns {Buffer}
 */
function getSigningKey(secretKey, dateStamp, region, service) {
  const kDate    = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion  = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  return kSigning;
}

/**
 * Build all AWS SigV4 headers for a PA API POST request.
 *
 * @param {object} payload - Request body as a plain object (will be JSON-serialised)
 * @returns {object} Headers map including Authorization and X-Amz-Date
 */
function buildSignedHeaders(payload) {
  const now = new Date();

  const amzDate   = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const bodyStr    = JSON.stringify(payload);
  const bodyHash   = hash(bodyStr);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=UTF-8\n` +
    `host:${PA_HOST}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;

  const signedHeaders =
    'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest = [
    'POST',
    PA_PATH,
    '',                 // no query string
    canonicalHeaders,
    signedHeaders,
    bodyHash
  ].join('\n');

  const credentialScope = `${dateStamp}/${PA_REGION}/${PA_SERVICE}/aws4_request`;

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hash(canonicalRequest)
  ].join('\n');

  const signingKey = getSigningKey(SECRET_KEY, dateStamp, PA_REGION, PA_SERVICE);
  const signature  = hmac(signingKey, stringToSign).toString('hex');

  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    'Content-Encoding':  'amz-1.0',
    'Content-Type':      'application/json; charset=UTF-8',
    'Host':              PA_HOST,
    'X-Amz-Date':        amzDate,
    'X-Amz-Target':      'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
    'Authorization':     authHeader
  };
}

// ─── Response normalisation ───────────────────────────────────────────────────

/**
 * Extract a safe string from a nested PA API value object.
 *
 * @param {object|undefined} valueObj
 * @returns {string}
 */
function safeStr(valueObj) {
  return (valueObj && valueObj.DisplayValue) ? String(valueObj.DisplayValue) : '';
}

/**
 * Extract a safe number from a nested PA API value object.
 *
 * @param {object|undefined} valueObj
 * @returns {number}
 */
function safeNum(valueObj) {
  if (!valueObj) return 0;
  const n = Number(valueObj.Amount !== undefined ? valueObj.Amount : valueObj.DisplayValue);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Convert a single PA API SearchItems result item to the PricePilot unified schema.
 *
 * @param {object} item - Raw PA API item object
 * @returns {object} Normalised product
 */
function normaliseItem(item) {
  const info        = item.ItemInfo || {};
  const offers      = item.Offers   || {};
  const images      = item.Images   || {};

  const title       = safeStr(info.Title);
  const brand       = safeStr((info.ByLineInfo || {}).Brand);
  const asin        = item.ASIN || '';
  const productUrl  = item.DetailPageURL || `https://www.amazon.in/dp/${asin}`;

  // Price from listing offers
  const listingSet  = (offers.Listings || [])[0] || {};
  const priceObj    = listingSet.Price || {};
  const currentPrice = safeNum(priceObj);

  // Savings
  const savingsObj  = priceObj.Savings || {};
  const savings     = safeNum(savingsObj);
  const discountPct = savingsObj.Percentage || 0;

  // Image (largest available)
  const primaryImg  = (images.Primary || {}).Large || {};
  const imageUrl    = primaryImg.URL || '';

  // Customer reviews
  const reviews     = item.CustomerReviews || {};
  const rating      = reviews.StarRating ? safeNum(reviews.StarRating) : 0;

  // Delivery / prime
  const deliveryInfo = listingSet.DeliveryInfo || {};
  const primeEligible = deliveryInfo.IsAmazonFulfilled || false;

  return {
    productId:          asin,
    productName:        title,
    brand,
    platform:           'amazon',
    source:             'official-api',
    productUrl,
    image:              imageUrl,
    currentPrice,
    productPrice:       currentPrice,
    finalPayablePrice:  Math.max(0, currentPrice - savings),
    totalSavings:       savings,
    discountPercentage: discountPct,
    gst:                0,          // GST included in listed price on Amazon India
    shipping:           primeEligible ? 0 : 99,
    bankOffer:          0,
    couponDiscount:     0,
    rating,
    availability:       currentPrice > 0,
    isPrimeEligible:    primeEligible,
    category:           safeStr((info.Classifications || {}).ProductGroup)
  };
}

// ─── PA API call ──────────────────────────────────────────────────────────────

/**
 * Call the Amazon PA API SearchItems operation.
 *
 * @param {string} query - Search keyword
 * @returns {Promise<Array<object>>} Normalised product array
 */
async function searchViaApi(query) {
  const payload = {
    Keywords:    query,
    PartnerTag:  PARTNER_TAG,
    PartnerType: 'Associates',
    Marketplace: MARKETPLACE,
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'ItemInfo.Classifications',
      'Offers.Listings.Price',
      'Offers.Listings.DeliveryInfo.IsAmazonFulfilled',
      'Images.Primary.Large',
      'CustomerReviews.StarRating'
    ],
    ItemCount: 10
  };

  const headers = buildSignedHeaders(payload);

  const response = await httpClient.request({
    url:     PA_ENDPOINT,
    method:  'POST',
    data:    payload,
    headers
  }, { retries: 1, delayMs: 500 });

  const items = (
    (response.data.SearchResult || {}).Items || []
  );

  return items.map(normaliseItem).filter((p) => p.productName && p.currentPrice > 0);
}

// ─── Provider interface ───────────────────────────────────────────────────────

module.exports = {
  platform:        'amazon',
  source:          _activeStrategy,
  _activeStrategy,

  /**
   * Search Amazon for products matching `query`.
   * Falls back to mock data if credentials are not configured.
   *
   * @param {string} query
   * @returns {Promise<Array<object>>}
   */
  async searchProducts(query) {
    if (!credentialsConfigured) {
      return mockProvider.searchProducts(query);
    }

    try {
      logger.info('Amazon PA API Request', { query });
      const products = await searchViaApi(query);
      logger.info('Amazon PA API Response', { query, count: products.length });
      return products;
    } catch (error) {
      logger.error('Amazon PA API Error – Falling Back to Mock', {
        query,
        error: error.message
      });
      return mockProvider.searchProducts(query);
    }
  }
};
