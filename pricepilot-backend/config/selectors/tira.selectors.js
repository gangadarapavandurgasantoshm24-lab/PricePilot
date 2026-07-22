/**
 * @module tira.selectors
 * @description DOM selectors for Tira Beauty search results page.
 *
 * Phase 2 upgrades:
 *  - Multiple fallback selectors
 *  - Added offer/cashback/coupon selectors
 *  - Added brand extraction
 *
 * Last verified: Tira Beauty search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.tirabeauty.com/search?q=${encodeURIComponent(query)}`,

  /** Base URL */
  baseUrl: 'https://www.tirabeauty.com',

  /** Container for each search result card */
  resultItem: '[class*="product-card"], [class*="ProductCard"], [class*="item"], .product-item',

  /** Brand name */
  brand: '[class*="brand"], [class*="Brand"], .brand-name',

  /** Product title */
  title: '[class*="product-name"], [class*="ProductName"], [class*="product-title"], h3, h4',

  /** Price */
  price: '[class*="offer-price"], [class*="sale-price"], [class*="discounted-price"], [class*="price"]',

  /** Original MRP */
  originalPrice: '[class*="mrp"], [class*="original-price"], [class*="regular-price"], [class*="strike"]',

  /** Discount */
  discount: '[class*="discount"], [class*="off"], [class*="badge"]',

  /** Rating */
  rating: '[class*="rating"], [aria-label*="rating"], [class*="star"]',

  /** Review count */
  reviewCount: '[class*="review"], [class*="ratingCount"]',

  /** Cashback / offer */
  offer: '[class*="cashback"], [class*="offer"], [class*="coupon"]',

  /** Product image */
  image: 'img[src*="tirabeauty"], img[loading="lazy"], img.product-image',

  /** Link to product detail */
  link: 'a[href*="/p/"], a[href*="tirabeauty"], [class*="product-card"] a',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], [class*="OutOfStock"], [class*="sold-out"]',

  /** Selector to wait for before extracting */
  waitFor: '[class*="product-card"], [class*="ProductCard"], [class*="product-list"]',

  /** No results */
  noResults: '[class*="no-result"], [class*="NoResult"]',
};
