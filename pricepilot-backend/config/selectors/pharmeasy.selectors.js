/**
 * @module pharmeasy.selectors
 * @description DOM selectors for PharmEasy search results page.
 *
 * Selectors are NEVER hardcoded inside provider files.
 * All Playwright providers import from config/selectors/.
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://pharmeasy.in/search/all?name=${encodeURIComponent(query)}`,

  /** Container for each search result card */
  resultItem: '[class*="ProductCard_mainContainer"], [class*="productCard"]',

  /** Product name */
  title: '[class*="ProductCard_medicineName"], [class*="medicineName"]',

  /** Discounted price */
  price: '[class*="ProductCard_price"], [class*="discountedPrice"]',

  /** MRP */
  originalPrice: '[class*="ProductCard_mrp"], [class*="mrp"]',

  /** Discount text */
  discount: '[class*="ProductCard_discount"], [class*="discountLabel"]',

  /** Product image */
  image: '[class*="ProductCard_productImage"] img, [class*="productImage"] img',

  /** Link to product detail page */
  link: 'a[href*="/otc/"], a[href*="/medicine-info/"]',

  /** Out of stock badge */
  outOfStock: '[class*="outOfStock"], [class*="ProductCard_outOfStock"]',

  /** Prescription-only badge */
  prescriptionRequired: '[class*="rx"], [class*="prescription"]',

  /** Selector to wait for before extracting */
  waitFor: '[class*="ProductCard_mainContainer"], .search-results-page',
};
