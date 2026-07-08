/**
 * @module myntra.playwright
 * @description Myntra Playwright provider – extends PlaywrightProvider base class.
 *
 * Strategy: 'playwright'
 *
 * Architecture:
 *   This class ONLY implements:
 *     1. get platform()         → 'myntra'
 *     2. get selectors()        → myntra.selectors.js
 *     3. extractProducts(page)  → Playwright extraction logic
 *
 *   The base class handles:
 *     - BrowserQueue.acquire()
 *     - page.goto()
 *     - waitForSelector()
 *     - normalizeProduct()
 *     - slot.release() (always, in finally)
 *     - Error recovery → returns [] on failure
 *
 * TOS & Compliance Note:
 *   Myntra's robots.txt allows crawling of product pages for user-agent *.
 *   This provider only reads publicly visible search results — no login,
 *   no CAPTCHA bypass, no rate limit circumvention.
 *   Usage must comply with Myntra's Terms of Service.
 *   In production, obtain explicit permission or use an official partnership API.
 *
 * Fallback:
 *   If Playwright is unavailable or the page fails, mock data is returned.
 */

const PlaywrightProvider = require('../base/playwrightProvider');
const selectors          = require('../../config/selectors/myntra.selectors');
const mockProvider       = require('./myntra.provider');

class MyntraPlaywrightProvider extends PlaywrightProvider {

  get platform()  { return 'myntra'; }
  get selectors() { return selectors; }

  // Mock fallback used by base class on any failure
  get mockFallback() { return mockProvider; }

  /**
   * Extract products from a loaded Myntra search results page.
   *
   * @param {import('playwright').Page} page
   * @param {string} query
   * @returns {Promise<Array<object>>}
   */
  async extractProducts(page, query) {
    const sel = this.selectors;

    // Scroll down once to trigger lazy-loaded images
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2)).catch(() => {});
    await page.waitForTimeout(800).catch(() => {});

    // Check for no-results state
    const noResults = await page.$(sel.noResults).catch(() => null);
    if (noResults) return [];

    const items = await page.$$(sel.resultItem);
    const products = [];

    for (const item of items.slice(0, 15)) {
      try {
        const brand      = await item.$eval(sel.brand,         el => el.textContent.trim()).catch(() => '');
        const name       = await item.$eval(sel.title,         el => el.textContent.trim()).catch(() => '');
        const priceText  = await item.$eval(sel.price,         el => el.textContent.trim()).catch(() => '0');
        const origText   = await item.$eval(sel.originalPrice, el => el.textContent.trim()).catch(() => '0');
        const discText   = await item.$eval(sel.discount,      el => el.textContent.trim()).catch(() => '');
        const imgSrc     = await item.$eval(sel.image,         el => el.src || el.getAttribute('data-src') || '').catch(() => '');
        const href       = await item.$eval(sel.link,          el => el.href).catch(() => '');

        const currentPrice  = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        const originalPrice = parseFloat(origText.replace(/[^0-9.]/g, '')) || currentPrice;
        const discPct       = parseInt(discText.replace(/[^0-9]/g, ''), 10) || 0;

        if (!name || currentPrice <= 0) continue;

        products.push({
          productName:  `${brand} ${name}`.trim(),
          brand,
          currentPrice,
          originalPrice,
          discountPercentage: discPct,
          image:         imgSrc,
          productUrl:    href || selectors.searchUrl(query),
          gst:           0,
          shipping:      0,
          bankOffer:     0,
          couponDiscount: 0,
          category:      'Fashion',
          availability:  true
        });
      } catch (_) { /* skip malformed item */ }
    }

    return products;
  }
}

module.exports = new MyntraPlaywrightProvider();
