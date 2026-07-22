/**
 * @module purplle.playwright
 * @description Purplle Playwright provider – extends PlaywrightProvider base class.
 *
 * Strategy: 'playwright'
 *
 * TOS & Compliance Note:
 *   This provider only reads publicly visible Purplle search results.
 *   No login, no CAPTCHA bypass, no rate limit circumvention.
 *   In production, obtain explicit permission or use an official partnership API.
 *
 * Fallback:
 *   If Playwright is unavailable or page fails, mock data is returned.
 */

const PlaywrightProvider = require('../base/playwrightProvider');
const selectors          = require('../../config/selectors/purplle.selectors');
const mockProvider       = require('./purplle.provider');

class PurpllePlaywrightProvider extends PlaywrightProvider {

  get platform()    { return 'purplle'; }
  get selectors()   { return selectors; }
  get mockFallback(){ return mockProvider; }

  /**
   * Extract products from a loaded Purplle search results page.
   *
   * @param {import('playwright').Page} page
   * @param {string} query
   * @returns {Promise<Array<object>>}
   */
  async extractProducts(page, query) {
    const sel = this.selectors;

    // Scroll to load lazy-rendered content
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2)).catch(() => {});
    await page.waitForTimeout(1000).catch(() => {});

    const items = await page.$$(sel.resultItem);
    const products = [];

    for (const item of items.slice(0, 30)) {
      try {
        const brand      = await item.$eval(sel.brand,         el => el.textContent.trim()).catch(() => '');
        const name       = await item.$eval(sel.title,         el => el.textContent.trim()).catch(() => '');
        const priceText  = await item.$eval(sel.price,         el => el.textContent.trim()).catch(() => '0');
        const origText   = await item.$eval(sel.originalPrice, el => el.textContent.trim()).catch(() => '0');
        const imgSrc     = await item.$eval(sel.image,         el => el.src || el.getAttribute('data-src') || '').catch(() => '');
        const href       = await item.$eval(sel.link,          el => el.href).catch(() => '');
        const oos        = await item.$(sel.outOfStock).catch(() => null);

        const currentPrice  = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        const originalPrice = parseFloat(origText.replace(/[^0-9.]/g, '')) || currentPrice;

        if (!name || currentPrice <= 0) continue;

        const discountPercentage = originalPrice > currentPrice
          ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
          : 0;

        products.push({
          productName:   `${brand} ${name}`.trim(),
          brand,
          currentPrice,
          originalPrice,
          discountPercentage,
          image:         imgSrc,
          productUrl:    href || selectors.searchUrl(query),
          gst:           0,
          shipping:      0,
          bankOffer:     0,
          couponDiscount: 0,
          category:      'Beauty',
          availability:  !oos
        });
      } catch (_) { /* skip malformed item */ }
    }

    return products;
  }
}

module.exports = new PurpllePlaywrightProvider();
