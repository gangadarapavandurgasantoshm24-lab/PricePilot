/**
 * @module apollo.selectors
 * @description DOM selectors for Apollo Pharmacy search results page.
 *
 * Selectors are NEVER hardcoded inside provider files.
 * All Playwright providers import from config/selectors/.
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(query)}`,

  /** Container for each search result card */
  resultItem: '.productCard_container__pKLRd, [class*="productCard"]',

  /** Product title / name */
  title: '.productCard_medicineName__LBvLu, [class*="medicineName"]',

  /** Selling price */
  price: '.Price_offerPrice__JGCP1, [class*="offerPrice"]',

  /** MRP / original price */
  originalPrice: '.Price_mrpPrice__3CDOW, [class*="mrpPrice"]',

  /** Discount percentage */
  discount: '.Price_discountPercent__F8u8D, [class*="discountPercent"]',

  /** Product image */
  image: 'img[class*="productCard"], [class*="productImage"] img',

  /** Link to product detail page */
  link: 'a[href*="/OTC/"], a[href*="/health-care/"]',

  /** Prescription badge (important for pharmacy compliance) */
  prescriptionRequired: '[class*="rxRequired"], [class*="prescription"]',

  /** Selector to wait for before extracting */
  waitFor: '[class*="productCard"], .search-results',
};
