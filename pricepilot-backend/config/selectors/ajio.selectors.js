/**
 * @module ajio.selectors
 * @description DOM selectors for AJIO search results page.
 *
 * Phase 2 upgrades:
 *  - Updated selectors for current AJIO layout
 *  - Added offer/coupon/cashback selectors
 *  - Multiple fallback selectors
 *
 * Last verified: AJIO search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.ajio.com/search/?text=${encodeURIComponent(query)}`,

  /** Base URL */
  baseUrl: 'https://www.ajio.com',

  /** Container for each search result card */
  resultItem: '.item, [class*="product"], .riGhtCol, [class*="Product"], article.item',

  /** Brand name */
  brand: '.brand, .nameCls, [class*="brand-name"], strong.brand',

  /** Product title */
  title: '.desc, [class*="description"], [class*="product-name"], p.nameCls',

  /** Discounted / current price */
  price: '.price strong, .price [class*="price"], .prod-sp, [class*="final-price"]',

  /** Original price */
  originalPrice: '.orginal-price, .prod-cp, [class*="original-price"], [class*="mrp"]',

  /** Discount */
  discount: '.discount, [class*="discount"], [class*="off"]',

  /** Rating */
  rating: '.stars, [class*="rating"], [aria-label*="rating"]',

  /** Review count */
  reviewCount: '[class*="review-count"], [class*="ratingCount"]',

  /** Offer / coupon */
  offer: '[class*="offer"], [class*="coupon"], [class*="cashback"], [class*="discount-tag"]',

  /** Product image */
  image: 'img.imgDiv, img[src*="ajio"], img[loading="lazy"]',

  /** Link to product detail page */
  link: 'a[href*="/p/"], a.imgDesc, a.item',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], [class*="soldOut"]',

  /** Selector to wait for before extracting */
  waitFor: '.item, [class*="product-list"], [class*="riGhtCol"]',

  /** No results */
  noResults: '[class*="no-result"], [class*="emptyPage"]',
};
