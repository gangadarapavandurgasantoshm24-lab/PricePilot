/**
 * @module apollo.selectors
 * @description DOM selectors for Apollo Pharmacy search results page.
 *
 * Phase 2 upgrades:
 *  - Multiple fallback selectors
 *  - Added offer/cashback selectors for medicine offers
 *  - Added prescription and out-of-stock detection
 *
 * Last verified: Apollo Pharmacy search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(query)}`,

  /** Base URL */
  baseUrl: 'https://www.apollopharmacy.in',

  /** Container for each search result card */
  resultItem: '[class*="ProductCard"], [class*="product-card"], .product-card, [class*="item-box"]',

  /** Product name */
  title: '[class*="product-name"], [class*="ProductName"], [class*="medicine-name"], h3, h4',

  /** Discounted / offer price */
  price: '[class*="offer-price"], [class*="discounted-price"], [class*="price"], .price-info strong',

  /** MRP */
  originalPrice: '[class*="mrp"], [class*="MRP"], [class*="strike-price"], [class*="regular-price"]',

  /** Discount */
  discount: '[class*="discount"], [class*="off"], [class*="savings"]',

  /** Offer / cashback */
  offer: '[class*="cashback"], [class*="offer"], [class*="coupon"], [class*="Offer"]',

  /** Rating */
  rating: '[class*="rating"], [aria-label*="rating"]',

  /** Product image */
  image: 'img[class*="product"], img[src*="apollopharmacy"], img[loading="lazy"]',

  /** Link to product detail page */
  link: 'a[href*="/medicines/"], a[href*="/otc/"], a[href*="apollopharmacy"]',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], [class*="unavailable"], [class*="OutOfStock"]',

  /** Prescription required */
  prescriptionRequired: '[class*="rx"], [class*="prescription"], [class*="Rx"]',

  /** Selector to wait for before extracting */
  waitFor: '[class*="ProductCard"], [class*="product-card"], [class*="search-result"]',

  /** No results */
  noResults: '[class*="no-result"], [class*="NoResult"], [class*="empty"]',
};
