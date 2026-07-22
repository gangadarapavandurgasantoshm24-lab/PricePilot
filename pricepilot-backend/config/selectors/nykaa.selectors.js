/**
 * @module nykaa.selectors
 * @description DOM selectors for Nykaa search results page.
 *
 * Phase 2 upgrades:
 *  - Added cashback and offer selectors
 *  - Multiple CSS fallbacks
 *  - Added first-order offer detection
 *
 * Last verified: Nykaa search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.nykaa.com/search/result/?q=${encodeURIComponent(query)}&root=search&searchType=Manual`,

  /** Base URL */
  baseUrl: 'https://www.nykaa.com',

  /** Container for each search result card */
  resultItem: '.css-d5z3ro, .product-card-container, [class*="productCard"], [class*="product-card"]',

  /** Product brand */
  brand: '.css-1lx1l0c, [class*="brand"], .product-brand',

  /** Product title */
  title: '.css-xrzmfa, .productName, [class*="productName"], [class*="product-name"]',

  /** Discounted / final price */
  price: '.css-17x46n5, .discount-price, [class*="offer-price"], [class*="discounted-price"]',

  /** Original MRP price */
  originalPrice: '.css-1kqetwr, .mrp, [class*="mrp"], [class*="strike-price"]',

  /** Discount percentage */
  discount: '.css-cjdkff, .discountPercent, [class*="discount"], [class*="off"]',

  /** Star rating */
  rating: '.css-1ox41wv, [class*="rating"], [aria-label*="rating"]',

  /** Review count */
  reviewCount: '.css-1oucqh6, [class*="review-count"], [class*="ratings"]',

  /** Cashback / offer / coupon */
  offer: '[class*="offer"], [class*="coupon"], [class*="cashback"], .css-1xnxke3',

  /** Product image */
  image: 'img.css-2sxpn3, img.productImage, img[loading="lazy"], img[src*="nykaa"]',

  /** Link to product detail page */
  link: 'a.css-qlopj4, a[href*="/p/"], a[href*="nykaa.com"]',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], [class*="outOfStock"], .sold-out',

  /** Selector to wait for before extracting */
  waitFor: '.product-list, .search-page, [class*="search-result"], [class*="productCard"]',

  /** No results */
  noResults: '[class*="no-result"], [class*="noResult"]',
};
