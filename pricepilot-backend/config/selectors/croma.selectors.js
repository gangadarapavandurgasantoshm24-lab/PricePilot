/**
 * @module croma.selectors
 * @description DOM selectors for Croma search results page.
 *
 * Phase 2 upgrades:
 *  - Upgraded to more specific selectors
 *  - Added offer/EMI selectors for bank/coupon offer extraction
 *  - Added proper baseUrl
 *
 * Last verified: Croma search results layout (July 2026)
 */

module.exports = {
  /** Base URL for resolving relative links */
  baseUrl: 'https://www.croma.com',

  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&text=${encodeURIComponent(query)}`,

  /** Container for each search result card */
  resultItem: 'li.product-item:has(a[href*="/p/"]), .product-item:has(a[href*="/p/"]), [class*="product-item"]:has(a[href*="/p/"]), .cp-product:has(a[href*="/p/"]), a[href*="/p/"]:has(img)',

  /** Brand name */
  brand: '.pdp-brand, [class*="brand"], .product-brand',

  /** Product title */
  title: 'h3.product-title, .product-title a, [class*="product-title"], h3 a, h2, a[href*="/p/"]',

  /** Current/discounted price */
  price: 'span.amount, .new-price .amount, [class*="new-price"], [class*="actual-price"], [class*="offer-price"]',

  /** Original / MRP price */
  originalPrice: '.old-price .amount, [class*="old-price"], [class*="mrp"], [class*="strike"]',

  /** Discount badge */
  discount: '[class*="discount"], [class*="off"], .saving-label',

  /** Star rating */
  rating: '[class*="rating-count"], [class*="star-rating"], [aria-label*="rating"]',

  /** Review count */
  reviewCount: '[class*="review-count"], [class*="ratings-count"]',

  /** Product image */
  image: 'img.product-img, img[src*="croma"], img[loading="lazy"], img',

  /** Link to product detail page */
  link: 'a[href*="/p/"], a.product-item-link, h3 a',

  /** Delivery / EMI / bank offer text */
  delivery: '[class*="delivery"], [class*="offer"], [class*="emi"], .product-offers',

  /** Offer/bank offer */
  offer: '[class*="offer"], [class*="bank-offer"], .emi-offer, [class*="cashback"]',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], [class*="unavailable"], .out-of-stock',

  /** Selector to wait for before extracting */
  waitFor: 'a[href*="/p/"], .product-list, li.product-item, [class*="product-listing"], .cp-product',
};
