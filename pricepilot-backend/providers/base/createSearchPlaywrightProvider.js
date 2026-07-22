/**
 * @module createSearchPlaywrightProvider
 * @description Factory that creates a ready-to-use Playwright provider
 * using the Template Method pattern from PlaywrightProvider.
 *
 * Phase 2 upgrades:
 *  - maxItems increased from 15 to 30 (capture more products per search)
 *  - Multi-pass scrolling for lazy-loaded content
 *  - Offer text extraction passed to product data
 *  - Better generic fallback extractor with URL deduplication
 */

const PlaywrightProvider = require('./playwrightProvider');
const logger = require('../../utils/logger');

function createSearchPlaywrightProvider({
  className,
  platform,
  selectors,
  mockFallback = null,
  category,
  defaultBrand = '',
  defaultRating = 0,
  maxItems = 30,       // Phase 2: increased from 15 to 30
  scrollPasses = 3,    // Phase 2: multi-pass scrolling
  scrollWaitMs = 700,
  baseUrl,
  nameBuilder
}) {
  return new (class SearchPlaywrightProvider extends PlaywrightProvider {
    get platform() { return platform; }
    get selectors() { return selectors; }
    get mockFallback() { return mockFallback; }

    async extractProducts(page, query) {
      const sel = this.selectors;

      // Multi-pass scroll to trigger lazy loading
      await this.scrollForLazyContent(page, scrollPasses, scrollWaitMs);

      if (sel.noResults) {
        const noResults = await page.$(sel.noResults).catch(() => null);
        if (noResults) return [];
      }

      const items = await page.$$(sel.resultItem);
      const products = [];
      const rejected = [];

      for (const item of items.slice(0, maxItems)) {
        const product = await this.extractProductCard(item, query, {
          baseUrl,
          category,
          defaultBrand,
          defaultRating,
          nameBuilder
        }).catch(() => null);

        if (product?.__rejected) rejected.push(product);
        else if (product) products.push(product);
      }

      if (this.lastDiagnostics) {
        this.lastDiagnostics.cardsFound = items.length;
        this.lastDiagnostics.titlesExtracted = products.filter((p) => p.productName).length;
        this.lastDiagnostics.pricesExtracted = products.filter((p) => Number(p.currentPrice) > 0).length;
        this.lastDiagnostics.imagesExtracted = products.filter((p) => p.image).length;
        this.lastDiagnostics.urlsExtracted = products.filter((p) => p.productUrl).length;
        this.lastDiagnostics.rejected = rejected.length;
        this.lastDiagnostics.rejectionReasons = rejected.reduce((acc, item) => {
          (item.missing || ['unknown']).forEach((reason) => {
            acc[reason] = (acc[reason] || 0) + 1;
          });
          return acc;
        }, {});
      }

      logger.info('Playwright Extraction Summary', {
        platform,
        cardsFound: items.length,
        extracted: products.length,
        rejected: rejected.length,
        titlesExtracted: products.filter((p) => p.productName).length,
        pricesExtracted: products.filter((p) => Number(p.currentPrice) > 0).length,
        imagesExtracted: products.filter((p) => p.image).length,
        urlsExtracted: products.filter((p) => p.productUrl).length,
        mode: 'selectors'
      });

      if (products.length > 0) return products;

      // ── Generic DOM fallback ────────────────────────────────────────────────
      // Used when CSS selectors fail to match (layout changes, bot blocks)
      const fallbackProducts = await page.evaluate(({ category: providerCategory, baseUrl: providerBaseUrl, searchUrl, maxCount }) => {
        const parsePrice = (text) => {
          const match = String(text || '').replace(/,/g, '').match(/(?:₹|Rs\.?|INR)\s*([0-9]+(?:\.[0-9]+)?)/i);
          return match ? Number.parseFloat(match[1]) : 0;
        };

        const parseRating = (text) => {
          const match = String(text || '').match(/([0-5](?:\.[0-9])?)[\s★⭐]/);
          return match ? Number.parseFloat(match[1]) : 0;
        };

        const resolve = (url) => {
          try {
            return new URL(url, providerBaseUrl || searchUrl).href;
          } catch (_) {
            return url || '';
          }
        };

        const titleFromText = (text) => {
          const parts = String(text || '').trim()
            .split(/\n|(?=Price, product page)|(?=₹)|(?=M\.R\.P)|(?=\d(?:\.\d)?\s*out of 5)/i)
            .map((part) => part.replace(/\s+/g, ' ').trim())
            .filter(Boolean);
          const skip = /^(amazon's choice|best seller|sponsored|price, product page|\d+(\.\d+)?|m\.r\.p|₹|free delivery|add to cart)/i;
          return (parts.find((part) =>
            part.length >= 8 &&
            !skip.test(part) &&
            !/(out of 5 stars|bought in past month|^\(?[\d,.]+[kKmM]?\)?$)/i.test(part)
          ) || '').slice(0, 180);
        };

        const titleFromUrl = (url) => {
          try {
            const path = new URL(url, providerBaseUrl || searchUrl).pathname;
            return (path.split('/').filter(Boolean)[0] || '')
              .replace(/[-_]+/g, ' ')
              .replace(/\b(dp|gp|product|p)\b/gi, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 180);
          } catch (_) {
            return '';
          }
        };

        const looksLikeNonProductTitle = (value, cardText = '') => {
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
        };

        const titleQuality = (value, cardText = '') => {
          const title = String(value || '').replace(/\s+/g, ' ').trim();
          const text = String(cardText || '').replace(/\s+/g, ' ').trim();
          if (!title || looksLikeNonProductTitle(title, text)) return -100;

          const tokenCount = title.split(/\s+/).filter(Boolean).length;
          let score = Math.min(title.length, 180) + tokenCount * 8;
          if (/\b(iphone|galaxy|edge|pixel|oneplus|redmi|realme|moto|macbook|laptop|tv|ac)\b/i.test(title)) score += 35;
          if (/\b\d+\s*(gb|tb|inch|in|ton)?\b/i.test(title)) score += 25;
          if (/[\(\),-]/.test(title)) score += 8;
          if (/[a-z]+/i.test(title) && !/\s/.test(title)) score -= 45;
          return score;
        };

        const chooseBestTitle = (candidates, cardText = '') => candidates
          .map((value) => String(value || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .map((value) => ({ value, score: titleQuality(value, cardText) }))
          .filter((candidate) => candidate.score > -100)
          .sort((a, b) => b.score - a.score)[0]?.value || '';

        const anchors = Array.from(document.querySelectorAll('a[href]'))
          .filter((link) => {
            const href = link.getAttribute('href') || '';
            return href.length >= 10 && !/^#|javascript:/i.test(href);
          })
          .slice(0, 250);

        const candidates = anchors.map((link) => ({
          link,
          card: link.closest('li, article, [data-component-type], [data-id], [class*="product"], [class*="Product"], [class*="item"], div') || link
        }));

        const seen = new Set();
        const results = [];

        for (const { link, card } of candidates) {
          const text = (card.innerText || link.innerText || '').replace(/\s+/g, ' ').trim();
          const image = card.querySelector('img') || link.querySelector('img');
          const productUrl = resolve(link.getAttribute('href'));
          const title = chooseBestTitle([
            link.getAttribute('aria-label') ||
            '',
            link.getAttribute('title') ||
            '',
            image?.getAttribute('alt') ||
            '',
            image?.getAttribute('title') ||
            '',
            titleFromText(text) ||
            '',
            titleFromUrl(productUrl)
          ], text);
          const currentPrice = parsePrice(text);
          const imageUrl = resolve(
            image?.getAttribute('src') ||
            image?.getAttribute('data-src') ||
            image?.getAttribute('data-original') || ''
          );

          if (!title || looksLikeNonProductTitle(title, text) || currentPrice <= 0 || !productUrl || seen.has(productUrl)) continue;

          seen.add(productUrl);

          const isFreeDelivery = /free\s*(delivery|shipping)/i.test(text);

          results.push({
            productName: title.slice(0, 180),
            brand: '',
            currentPrice,
            originalPrice: currentPrice,
            discountPercentage: 0,
            rating: parseRating(text),
            reviewCount: 0,
            image: imageUrl,
            productUrl,
            gst: 0,
            shipping: isFreeDelivery ? 0 : 0,
            bankOffer: 0,
            couponDiscount: 0,
            category: providerCategory || '',
            availability: !/out of stock|sold out|unavailable/i.test(text),
            description: text.slice(0, 300)
          });

          if (results.length >= maxCount) break;
        }

        return results;
      }, {
        category,
        baseUrl: baseUrl || sel.baseUrl,
        searchUrl: sel.searchUrl(query),
        maxCount: maxItems
      });

      logger.info('Playwright Extraction Summary', {
        platform,
        cardsFound: items.length,
        extracted: fallbackProducts.length,
        rejected: 0,
        mode: 'generic-fallback'
      });

      if (this.lastDiagnostics) {
        this.lastDiagnostics.cardsFound = Math.max(this.lastDiagnostics.cardsFound || 0, items.length);
        this.lastDiagnostics.titlesExtracted = fallbackProducts.filter((p) => p.productName).length;
        this.lastDiagnostics.pricesExtracted = fallbackProducts.filter((p) => Number(p.currentPrice) > 0).length;
        this.lastDiagnostics.imagesExtracted = fallbackProducts.filter((p) => p.image).length;
        this.lastDiagnostics.urlsExtracted = fallbackProducts.filter((p) => p.productUrl).length;
        this.lastDiagnostics.rejected = 0;
        this.lastDiagnostics.mode = 'generic-fallback';
      }

      return fallbackProducts;
    }
  })();
}

module.exports = createSearchPlaywrightProvider;
