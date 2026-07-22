/**
 * @module playwrightProvider
 * @description Abstract base class for all Playwright-based providers.
 *
 * Phase 2 upgrades:
 *  - Stealth headers (realistic User-Agent, Accept-Language, Referer)
 *  - Human-like navigation delay (random 300–800ms) before extraction
 *  - Improved extractProductCard: pulls offer text from additional selectors
 *  - Better image resolution (srcset fallback)
 *  - Enhanced scroll for lazy-loaded content
 *
 * Implements the Template Method pattern:
 *  - The base class handles the full page lifecycle (acquire → navigate →
 *    wait → cleanup)
 *  - Subclasses implement only `extractProducts(page, query)` and
 *    `buildSearchUrl(query)`
 *
 * Every Playwright provider must:
 *  1. Extend PlaywrightProvider
 *  2. Set `get platform()` → canonical platform key
 *  3. Set `get selectors()` → import from config/selectors/
 *  4. Implement `extractProducts(page, query)` → Array of raw product objects
 */

const browserQueue           = require('../../services/browserQueue');
const { normalizeProduct }   = require('../../services/normalization.service');
const { booleanEnv }         = require('../../config/env');
const logger                 = require('../../utils/logger');

const ENABLE_MOCK_FALLBACK = booleanEnv('ENABLE_MOCK_FALLBACK', process.env.NODE_ENV === 'test');

// ─── Stealth configuration ───────────────────────────────────────────────────

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
];

function randomAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(min = 300, max = 900) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class PlaywrightProvider {
  constructor() {
    this.lastDiagnostics = null;
  }

  // ─── Abstract interface (subclasses must override) ──────────────────────────

  /**
   * Canonical platform key matching config/providers.js.
   * @returns {string}
   * @abstract
   */
  get platform() {
    throw new Error(`${this.constructor.name} must implement get platform()`);
  }

  /**
   * Selectors imported from config/selectors/
   * @returns {object}
   * @abstract
   */
  get selectors() {
    throw new Error(`${this.constructor.name} must implement get selectors()`);
  }

  /**
   * Optional mock provider to use as fallback when Playwright fails.
   * Return null (default) to return an empty array on failure instead.
   *
   * @returns {object|null}
   */
  get mockFallback() { return null; }

  /**
   * Extract raw product data from a loaded search results page.
   *
   * @param {import('playwright').Page} page  - Playwright page at search URL
   * @param {string}                    query - Original search query
   * @returns {Promise<Array<object>>}         - Raw product objects (not yet normalised)
   * @abstract
   */
  async extractProducts(page, query) {  // eslint-disable-line no-unused-vars
    throw new Error(`${this.constructor.name} must implement extractProducts(page, query)`);
  }

  // ─── Shared extraction helpers ─────────────────────────────────────────────

  async scrollForLazyContent(page, passes = 3, waitMs = 700) {
    for (let i = 1; i <= passes; i++) {
      await page.evaluate((pass) => window.scrollBy(0, window.innerHeight * pass), i).catch(() => {});
      await page.waitForTimeout(waitMs).catch(() => {});
    }
    // Scroll back to top so all cards are accessible
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await page.waitForTimeout(300).catch(() => {});
  }

  async textFrom(scope, selector, fallback = '') {
    if (!selector) return fallback;
    return scope.$eval(selector, (el) => (el.textContent || '').trim()).catch(() => fallback);
  }

  async textFromAny(scope, selectors = [], fallback = '') {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const selector of list.filter(Boolean)) {
      const value = await this.textFrom(scope, selector);
      if (value) return value;
    }
    return fallback;
  }

  async attrFrom(scope, selector, attr, fallback = '') {
    if (!selector) return fallback;
    return scope.$eval(selector, (el, name) => el.getAttribute(name) || '', attr).catch(() => fallback);
  }

  async attrFromAny(scope, selectors = [], attrs = [], fallback = '') {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    const attrList = Array.isArray(attrs) ? attrs : [attrs];
    for (const selector of selectorList.filter(Boolean)) {
      for (const attr of attrList.filter(Boolean)) {
        const value = await this.attrFrom(scope, selector, attr);
        if (value) return value;
      }
    }
    return fallback;
  }

  async cardText(item) {
    return item.evaluate((el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()).catch(() => '');
  }

  deriveTitleFromText(text) {
    const raw = String(text || '').trim();
    if (!raw) return '';

    const lines = raw
      .split(/\r?\n|(?=Price, product page)|(?=₹)|(?=M\.R\.P)|(?=\d(?:\.\d)?\s*out of 5)/i)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const rejected = /^(amazon's choice|best seller|sponsored|price, product page|\d+(\.\d+)?|m\.r\.p|₹|free delivery|add to cart)/i;
    const title = lines.find((line) =>
      line.length >= 8 &&
      !rejected.test(line) &&
      !/(out of 5 stars|bought in past month|^\(?[\d,.]+[kKmM]?\)?$)/i.test(line)
    );

    return (title || '').slice(0, 180);
  }

  titleQuality(value, cardText = '') {
    const title = String(value || '').replace(/\s+/g, ' ').trim();
    const text = String(cardText || '').replace(/\s+/g, ' ').trim();
    if (!title || this.looksLikeNonProductTitle(title, text)) return -100;

    let score = Math.min(title.length, 180);
    const tokenCount = title.split(/\s+/).filter(Boolean).length;
    score += tokenCount * 8;
    if (/\b(iphone|galaxy|edge|pixel|oneplus|redmi|realme|moto|macbook|laptop|tv|ac)\b/i.test(title)) score += 35;
    if (/\b\d+\s*(gb|tb|inch|in|ton)?\b/i.test(title)) score += 25;
    if (/[\(\),-]/.test(title)) score += 8;
    if (/^(sponsored|amazon's choice|best seller)$/i.test(title)) score -= 80;
    if (/^[a-z]+$/i.test(title) && tokenCount === 1) score -= 45;
    return score;
  }

  chooseBestTitle(candidates = [], cardText = '') {
    return candidates
      .map((value) => String(value || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .map((value) => ({ value, score: this.titleQuality(value, cardText) }))
      .filter((candidate) => candidate.score > -100)
      .sort((a, b) => b.score - a.score)[0]?.value || '';
  }

  deriveTitleFromUrl(url) {
    try {
      const parsed = new URL(url, 'https://example.com');
      const segment = parsed.pathname.split('/').filter(Boolean)[0] || '';
      return segment
        .replace(/[-_]+/g, ' ')
        .replace(/\b(dp|gp|product|p)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);
    } catch (_) {
      return '';
    }
  }

  isMarketplaceBrand(value) {
    return /^(amazon|flipkart|croma|reliance digital|vijay sales|vijaysales|myntra|ajio|meesho|nykaa|purplle|tira|apollo|pharmeasy|tata 1mg|netmeds)$/i
      .test(String(value || '').trim());
  }

  looksLikeNonProductTitle(value, cardText = '') {
    const title = String(value || '').replace(/\s+/g, ' ').trim();
    const text = String(cardText || '').replace(/\s+/g, ' ').trim();
    if (!title) return true;
    if (/^(below|under|above)\s*(rs\.?|₹)?\s*\d+/i.test(title)) return true;
    if (/^rs\.?\s*\d+\s*[-–]\s*\d+$/i.test(title)) return true;
    if (/^₹?\s*\d+\s*[-–]\s*₹?\s*\d+$/i.test(title)) return true;
    if (/^(price|brand|category|discount|availability|customer rating|filter|sort by)$/i.test(title)) return true;
    if (title.length < 4 && !/\d/.test(title)) return true;
    if (/^(apple|samsung|motorola|oneplus|nike|adidas|cetaphil|dolo|crocin|paracetamol)$/i.test(title) && !/\b(\d+|iphone|galaxy|edge|air|max|cleanser|tablet|650)\b/i.test(text)) return true;
    return false;
  }

  parsePrice(value, fallback = 0) {
    const cleaned = String(value || '').replace(/,/g, '').replace(/[^0-9.]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  parseRating(value, fallback = 0) {
    const parsed = Number.parseFloat(String(value || '').match(/\d+(\.\d+)?/)?.[0]);
    if (!Number.isFinite(parsed)) return fallback;
    return parsed > 5 ? parsed / 10 : parsed;
  }

  parseCount(value, fallback = 0) {
    const text = String(value || '').toLowerCase().replace(/,/g, '');
    const number = Number.parseFloat(text.match(/\d+(\.\d+)?/)?.[0]);
    if (!Number.isFinite(number)) return fallback;
    if (text.includes('k')) return Math.round(number * 1000);
    if (text.includes('lakh')) return Math.round(number * 100000);
    return Math.round(number);
  }

  parseDiscount(value, currentPrice = 0, originalPrice = 0) {
    const explicit = Number.parseInt(String(value || '').match(/\d+/)?.[0], 10);
    if (Number.isFinite(explicit)) return explicit;
    if (originalPrice > currentPrice && currentPrice > 0) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
  }

  resolveUrl(url, baseUrl) {
    if (!url) return '';
    try {
      return new URL(url, baseUrl).href;
    } catch (_) {
      return url;
    }
  }

  /**
   * Extract all offer-relevant text from a product card element.
   * Tries multiple selectors: offer, delivery, bankOffer, description.
   */
  async extractOfferText(item) {
    const sel = this.selectors;
    const candidates = [
      sel.offer,
      sel.bankOffer,
      sel.delivery,
      sel.description
    ].filter(Boolean);

    const texts = await Promise.all(
      candidates.map(s => this.textFrom(item, s).catch(() => ''))
    );

    return texts.filter(Boolean).join(' ');
  }

  async extractProductCard(item, query, config = {}) {
    const sel = this.selectors;
    const baseUrl = config.baseUrl || sel.baseUrl || sel.searchUrl(query);

    const cardText = await this.cardText(item);
    const brand = await this.textFromAny(item, sel.brand);
    const priceText = await this.textFromAny(item, sel.price);
    const originalText = await this.textFromAny(item, sel.originalPrice);
    const discountText = await this.textFromAny(item, sel.discount);
    const ratingText = await this.textFromAny(item, sel.rating);
    const reviewText = await this.textFromAny(item, sel.reviewCount);

    // Collect ALL offer-related text for offer extraction
    const offerText = await this.extractOfferText(item);
    const deliveryText = await this.textFrom(item, sel.delivery);

    const availabilityText = await this.textFrom(item, sel.availability);
    const href = await this.attrFromAny(item, sel.link, ['href']);

    // Try multiple image attributes
    const src = await this.attrFromAny(item, sel.image, ['src', 'data-src', 'data-original', 'srcset']);
    const imageAlt = await this.attrFromAny(item, sel.image, ['alt', 'title', 'aria-label']);
    const linkLabel = await this.attrFromAny(item, sel.link, ['aria-label', 'title']);
    const linkText = await this.textFromAny(item, sel.link);
    const selectorTitle = await this.textFromAny(item, sel.title);
    const textTitle = this.deriveTitleFromText(cardText);
    const urlTitle = this.deriveTitleFromUrl(href);
    const title = this.chooseBestTitle([
      selectorTitle,
      linkLabel,
      linkText,
      imageAlt,
      textTitle,
      urlTitle
    ], cardText);

    const outOfStock = sel.outOfStock ? await item.$(sel.outOfStock).catch(() => null) : null;

    const currentPrice = this.parsePrice(priceText);
    const originalPrice = this.parsePrice(originalText, currentPrice);
    const realBrand = this.isMarketplaceBrand(brand) ? '' : brand;
    const productName = config.nameBuilder
      ? config.nameBuilder({ brand, title })
      : title || (realBrand ? `${realBrand} ${title}`.trim() : title);

    if (!productName || this.looksLikeNonProductTitle(productName, cardText) || currentPrice <= 0 || !href) {
      const missing = [];
      if (!productName) missing.push('title');
      if (productName && this.looksLikeNonProductTitle(productName, cardText)) missing.push('non-product-title');
      if (currentPrice <= 0) missing.push('price');
      if (!href) missing.push('url');

      logger.warn('Playwright Product Card Rejected', {
        platform: this.platform,
        hasTitle: Boolean(productName),
        hasPrice: currentPrice > 0,
        hasUrl: Boolean(href),
        missing,
        titleSample: productName,
        textSample: cardText.slice(0, 120)
      });
      return { __rejected: true, missing, textSample: cardText.slice(0, 120) };
    }

    // Detect free shipping from offer/delivery text
    const isFreeDelivery = /free\s*(delivery|shipping)/i.test(deliveryText + ' ' + offerText);

    return {
      productName,
      brand: realBrand || config.defaultBrand || '',
      currentPrice,
      originalPrice,
      discountPercentage: this.parseDiscount(discountText, currentPrice, originalPrice),
      rating: this.parseRating(ratingText, config.defaultRating || 0),
      reviewCount: this.parseCount(reviewText, 0),
      image: this.resolveUrl(String(src || '').split(/\s+/)[0], baseUrl),
      productUrl: this.resolveUrl(href, baseUrl) || sel.searchUrl(query),
      gst: 0,
      shipping: isFreeDelivery ? 0 : (config.shipping || 0),
      bankOffer: 0,
      couponDiscount: 0,
      category: config.category || '',
      availability: outOfStock ? false : !/out of stock|sold out|unavailable/i.test(availabilityText),
      // Pass all offer text for downstream extractOffers() in normalization
      description: offerText || deliveryText
    };
  }

  // ─── Template method (do NOT override) ─────────────────────────────────────

  /**
   * Main provider interface — called by Platform Manager.
   *
   * Full lifecycle:
   *   1. Acquire a page slot from BrowserQueue
   *   2. Set stealth headers
   *   3. Navigate to search URL
   *   4. Wait for results selector
   *   5. Human-like delay
   *   6. Extract raw products
   *   7. Normalise to unified schema
   *   8. Release page slot (always, even on error)
   *
   * @param {string} query - User search term
   * @returns {Promise<Array<object>>} Normalised products in unified schema
   */
  async searchProducts(query) {
    const startedAt = Date.now();
    let slot;
    this.lastDiagnostics = {
      provider: this.platform,
      search: query,
      browserStarted: false,
      searchExecuted: false,
      searchCompleted: false,
      cardsFound: 0,
      titlesExtracted: 0,
      pricesExtracted: 0,
      imagesExtracted: 0,
      urlsExtracted: 0,
      productsExtracted: 0,
      productsNormalized: 0,
      productsValidated: 0,
      rejected: 0,
      returned: 0,
      elapsedTimeMs: 0,
      errors: []
    };

    try {
      slot = await browserQueue.acquire();
      this.lastDiagnostics.browserStarted = true;

      // ── Stealth: set realistic headers ─────────────────────────────────────
      await slot.page.setExtraHTTPHeaders({
        'User-Agent': randomAgent(),
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      }).catch(() => {});

      const url = this.selectors.searchUrl(query);
      logger.info('Playwright Provider Navigating', { platform: this.platform, url });
      this.lastDiagnostics.searchExecuted = true;

      await slot.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout:   30000
      });
      this.lastDiagnostics.searchCompleted = true;

      // Wait for the result container to appear
      if (this.selectors.waitFor) {
        await slot.page.waitForSelector(this.selectors.waitFor, { timeout: 10000 }).catch((error) => {
          logger.warn('Playwright Provider Wait Selector Timeout', {
            platform: this.platform,
            selector: this.selectors.waitFor,
            error: error.message
          });
        });
      }

      // Human-like delay before extraction
      await slot.page.waitForTimeout(randomDelay()).catch(() => {});

      const rawProducts = await this.extractProducts(slot.page, query);
      this.lastDiagnostics.productsExtracted = rawProducts.length;

      logger.info('Playwright Provider Extracted', {
        platform:        this.platform,
        count:           rawProducts.length,
        executionTimeMs: Date.now() - startedAt
      });

      const normalized = rawProducts.map((raw) => normalizeProduct(raw, this.platform, 'playwright'));
      this.lastDiagnostics.productsNormalized = normalized.length;
      this.lastDiagnostics.productsValidated = normalized.length;
      this.lastDiagnostics.returned = normalized.length;
      this.lastDiagnostics.elapsedTimeMs = Date.now() - startedAt;
      return normalized;
    } catch (error) {
      logger.error('Playwright Provider Error', {
        platform: this.platform,
        error:    error.message,
        executionTimeMs: Date.now() - startedAt
      });
      this.lastDiagnostics.errors.push(error.message);
      this.lastDiagnostics.elapsedTimeMs = Date.now() - startedAt;
      // Delegate to mock fallback if configured, else return []
      if (ENABLE_MOCK_FALLBACK && this.mockFallback) {
        logger.info('Playwright Provider: Delegating to Mock Fallback', { platform: this.platform });
        const fallback = await this.mockFallback.searchProducts(query);
        this.lastDiagnostics.returned = fallback.length;
        this.lastDiagnostics.productsNormalized = fallback.length;
        this.lastDiagnostics.productsValidated = fallback.length;
        return fallback;
      }
      return [];
    } finally {
      if (this.lastDiagnostics) {
        this.lastDiagnostics.elapsedTimeMs = Date.now() - startedAt;
      }
      if (slot) {
        await slot.release().catch((err) =>
          logger.warn('Browser Slot Release Error', { error: err.message })
        );
      }
    }
  }
}

module.exports = PlaywrightProvider;
