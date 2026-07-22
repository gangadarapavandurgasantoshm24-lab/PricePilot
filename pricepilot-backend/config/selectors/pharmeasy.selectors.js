/**
 * @module pharmeasy.selectors
 * @description DOM selectors for PharmEasy search results page.
 *
 * Phase 2 upgrades:
 *  - Added cashback / medicine-offer selectors
 *  - Added prescription-only detection
 *  - Multiple fallback selectors
 *
 * Last verified: PharmEasy search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://pharmeasy.in/search/all?name=${encodeURIComponent(query)}`,

  /** Base URL */
  baseUrl: 'https://pharmeasy.in',

  /** Container for each search result card */
  resultItem: '[class*="ProductCard_mainContainer"], [class*="productCard"], [class*="ProductCard"], .productCard',

  /** Product name */
  title: '[class*="ProductCard_medicineName"], [class*="medicineName"], [class*="product-name"], h3',

  /** Discounted price */
  price: '[class*="ProductCard_price"], [class*="discountedPrice"], [class*="offer-price"]',

  /** MRP */
  originalPrice: '[class*="ProductCard_mrp"], [class*="mrp"], [class*="MRP"]',

  /** Discount text */
  discount: '[class*="ProductCard_discount"], [class*="discountLabel"], [class*="discount"]',

  /** Cashback / offer text */
  offer: '[class*="cashback"], [class*="offer"], [class*="coupon"], [class*="Cashback"]',

  /** Product image */
  image: '[class*="ProductCard_productImage"] img, [class*="productImage"] img, img[loading="lazy"]',

  /** Link to product detail page */
  link: 'a[href*="/otc/"], a[href*="/medicine-info/"], a[href*="pharmeasy"]',

  /** Out of stock badge */
  outOfStock: '[class*="outOfStock"], [class*="ProductCard_outOfStock"], [class*="out-of-stock"]',

  /** Prescription-only badge */
  prescriptionRequired: '[class*="rx"], [class*="prescription"], [class*="Rx"]',

  /** Selector to wait for before extracting */
  waitFor: '[class*="ProductCard_mainContainer"], [class*="search-result"], [class*="productCard"]',

  /** No results */
  noResults: '[class*="NoResult"], [class*="no-result"], [class*="emptyState"]',
};
