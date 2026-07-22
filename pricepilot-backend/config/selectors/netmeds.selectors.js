/**
 * @module netmeds.selectors
 * @description DOM selectors for Netmeds search results page.
 *
 * Phase 2 upgrades:
 *  - Multiple fallback selectors
 *  - Added offer/cashback detection
 *  - Added prescription and out-of-stock detection
 *
 * Last verified: Netmeds search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(query)}/all`,

  /** Base URL */
  baseUrl: 'https://www.netmeds.com',

  /** Container for each search result card */
  resultItem: '.ais-InfiniteHits-item, li.ais-InfiniteHits-item, [class*="product-item"], .cat-item',

  /** Product name */
  title: '[class*="clsgetname"], [class*="product-name"], h3, h4, .MuiTypography-body1',

  /** Price */
  price: '[class*="price-box"] .special-price, .price-box .price, [class*="special-price"], .price-value',

  /** Original MRP */
  originalPrice: '.old-price .price, [class*="regular-price"], [class*="mrp"]',

  /** Discount */
  discount: '[class*="discount-percent"], [class*="off"], [class*="discount"]',

  /** Cashback / offer */
  offer: '[class*="cashback"], [class*="offer"], [class*="coupon"]',

  /** Product image */
  image: 'img.product-image-photo, img[src*="netmeds"], img[loading="lazy"]',

  /** Link to product detail */
  link: 'a[href*="/medicines/"], a.product-item-link, a[href*="netmeds"]',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], .out-of-stock, [class*="unavailable"]',

  /** Prescription */
  prescriptionRequired: '[class*="rx"], [class*="prescription"]',

  /** Selector to wait for before extracting */
  waitFor: '.ais-InfiniteHits, .ais-InfiniteHits-item, [class*="product-list"]',

  /** No results */
  noResults: '[class*="no-result"], [class*="empty-search"]',
};
