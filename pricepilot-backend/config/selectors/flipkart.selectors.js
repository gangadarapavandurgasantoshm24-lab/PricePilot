/**
 * @module flipkart.selectors
 * @description DOM selectors for Flipkart search results page.
 *
 * Selectors are NEVER hardcoded inside provider files.
 * All Playwright providers import from config/selectors/.
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,

  /** Container for each search result card */
  resultItem: '._1AtVbE',

  /** Product title */
  title: '._4rR01T, .s1Q9rs',

  /** Final price (after discounts) */
  price: '._30jeq3',

  /** Original price (before discount) */
  originalPrice: '._3I9_wc',

  /** Discount percentage text */
  discount: '._3Ay6Sb',

  /** Star rating */
  rating: '._3LWZlK',

  /** Review count */
  reviewCount: '._2_R_DZ',

  /** Product image */
  image: '._396cs4',

  /** Link to product detail page (relative, prepend https://www.flipkart.com) */
  link: 'a._1fQZEK, a.s1Q9rs',

  /** Free delivery badge */
  freeDelivery: '._3tcKJj',

  /** Selector to wait for before extracting */
  waitFor: '._1YokD2',
};
