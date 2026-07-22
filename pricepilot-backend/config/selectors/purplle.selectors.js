/**
 * @module purplle.selectors
 * @description DOM selectors for Purplle search results page.
 *
 * Phase 2 upgrades:
 *  - Multiple fallback selectors
 *  - Added offer/cashback/coupon selectors
 *  - Added brand extraction
 *
 * Last verified: Purplle search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.purplle.com/search?q=${encodeURIComponent(query)}`,

  /** Base URL */
  baseUrl: 'https://www.purplle.com',

  /** Container for each search result card */
  resultItem: '[class*="productCard"], [class*="product-card"], [class*="ProductCard"], .plp-card',

  /** Brand name */
  brand: '[class*="brand"], [class*="Brand"], .brand-name',

  /** Product title */
  title: '[class*="product-name"], [class*="ProductName"], [class*="product-title"], h3',

  /** Discounted / offer price */
  price: '[class*="offer-price"], [class*="discounted-price"], [class*="special-price"], [class*="sale-price"]',

  /** Original MRP */
  originalPrice: '[class*="mrp"], [class*="MRP"], [class*="regular-price"], [class*="strike"]',

  /** Discount */
  discount: '[class*="discount"], [class*="off"], [class*="savings"]',

  /** Rating */
  rating: '[class*="rating"], [aria-label*="rating"], [class*="star"]',

  /** Review count */
  reviewCount: '[class*="review"], [class*="ratingCount"]',

  /** Cashback / offer / coupon */
  offer: '[class*="cashback"], [class*="offer"], [class*="coupon"], [class*="Cashback"]',

  /** Product image */
  image: 'img[src*="purplle"], img[loading="lazy"], img.product-image',

  /** Link to product detail */
  link: 'a[href*="/p/"], a[href*="purplle"], [class*="productCard"] a',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], [class*="OutOfStock"]',

  /** Selector to wait for before extracting */
  waitFor: '[class*="productCard"], [class*="product-list"], .plp-card',

  /** No results */
  noResults: '[class*="no-result"], [class*="emptyState"]',
};
