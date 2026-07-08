/**
 * @module playwrightProvider
 * @description Abstract base class for all Playwright-based providers.
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
 *
 * Usage in Week 6+:
 *   const PlaywrightProvider = require('../base/playwrightProvider');
 *   const selectors = require('../../config/selectors/flipkart.selectors');
 *
 *   class FlipkartProvider extends PlaywrightProvider {
 *     get platform()   { return 'flipkart'; }
 *     get selectors()  { return selectors; }
 *     async extractProducts(page, query) { ... }
 *   }
 *   module.exports = new FlipkartProvider();
 */

const browserQueue           = require('../../services/browserQueue');
const { normalizeProduct }   = require('../../services/normalization.service');
const logger                 = require('../../utils/logger');

class PlaywrightProvider {
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

  // ─── Template method (do NOT override) ─────────────────────────────────────

  /**
   * Main provider interface — called by Platform Manager.
   *
   * Full lifecycle:
   *   1. Acquire a page slot from BrowserQueue
   *   2. Navigate to search URL
   *   3. Wait for results selector
   *   4. Extract raw products
   *   5. Normalise to unified schema
   *   6. Release page slot (always, even on error)
   *
   * @param {string} query - User search term
   * @returns {Promise<Array<object>>} Normalised products in unified schema
   */
  async searchProducts(query) {
    const startedAt = Date.now();
    let slot;

    try {
      slot = await browserQueue.acquire();

      const url = this.selectors.searchUrl(query);
      logger.info('Playwright Provider Navigating', { platform: this.platform, url });

      await slot.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout:   30000
      });

      // Wait for the result container to appear
      if (this.selectors.waitFor) {
        await slot.page.waitForSelector(this.selectors.waitFor, { timeout: 15000 });
      }

      const rawProducts = await this.extractProducts(slot.page, query);

      logger.info('Playwright Provider Extracted', {
        platform:        this.platform,
        count:           rawProducts.length,
        executionTimeMs: Date.now() - startedAt
      });

      return rawProducts.map((raw) => normalizeProduct(raw, this.platform, 'playwright'));
    } catch (error) {
      logger.error('Playwright Provider Error', {
        platform: this.platform,
        error:    error.message,
        executionTimeMs: Date.now() - startedAt
      });
      // Delegate to mock fallback if configured, else return []
      if (this.mockFallback) {
        logger.info('Playwright Provider: Delegating to Mock Fallback', { platform: this.platform });
        return this.mockFallback.searchProducts(query);
      }
      return [];
    } finally {
      if (slot) {
        await slot.release().catch((err) =>
          logger.warn('Browser Slot Release Error', { error: err.message })
        );
      }
    }
  }
}

module.exports = PlaywrightProvider;
