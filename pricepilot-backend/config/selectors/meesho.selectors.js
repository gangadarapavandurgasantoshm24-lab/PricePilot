/**
 * @module meesho.selectors
 * @description DOM selectors for Meesho search results page.
 *
 * Phase 2 upgrades:
 *  - Multiple fallback selectors for obfuscated classes
 *  - Added offer/coupon/cashback selectors
 *  - Added delivery and out-of-stock detection
 *
 * Last verified: Meesho search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.meesho.com/search?q=${encodeURIComponent(query)}`,

  /** Base URL */
  baseUrl: 'https://www.meesho.com',

  /** Container for each search result card */
  resultItem: '[class*="ProductCard"], [class*="product-card"], [class*="NewProductCard"], div[style*="position"]:has(a[href*="/p/"])',

  /** Product name */
  title: '[class*="ProductCard__Title"], [class*="product-title"], [class*="title"], h2, h3',

  /** Price */
  price: '[class*="ProductCard__Price"], [class*="price"], [class*="PriceContainer"] h5',

  /** Original price */
  originalPrice: '[class*="ProductCard__OriginalPrice"], [class*="strike"], [class*="mrp"]',

  /** Discount */
  discount: '[class*="ProductCard__Discount"], [class*="discount"], [class*="off"]',

  /** Rating */
  rating: '[class*="Rating"], [class*="rating"], [aria-label*="rating"]',

  /** Review count */
  reviewCount: '[class*="review"], [class*="ratingCount"]',

  /** Offer / free delivery / coupon */
  offer: '[class*="offer"], [class*="coupon"], [class*="free-shipping"], [class*="FreeDelivery"]',

  /** Product image */
  image: 'img[class*="ProductCard"], img[src*="meesho"], img[loading="lazy"]',

  /** Link to product detail page */
  link: 'a[href*="/p/"], a.product-link, [class*="ProductCard"] a',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], [class*="OutOfStock"], [class*="unavailable"]',

  /** Selector to wait for before extracting */
  waitFor: '[class*="ProductCard"], [class*="product-list"], [class*="NewProductCard"]',

  /** No results */
  noResults: '[class*="no-result"], [class*="emptyState"], [class*="NoResult"]',
};
