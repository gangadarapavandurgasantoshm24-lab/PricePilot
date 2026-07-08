/**
 * @module nykaa.selectors
 * @description DOM selectors for Nykaa search results page.
 *
 * Selectors are NEVER hardcoded inside provider files.
 * All Playwright providers import from config/selectors/.
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.nykaa.com/search/result/?q=${encodeURIComponent(query)}`,

  /** Container for each search result card */
  resultItem: '.product-list .css-d5z3ro, .product-card-container',

  /** Product title */
  title: '.css-xrzmfa, .productName',

  /** Discounted / final price */
  price: '.css-17x46n5, .discount-price',

  /** Original price */
  originalPrice: '.css-1kqetwr, .mrp',

  /** Discount percentage */
  discount: '.css-cjdkff, .discountPercent',

  /** Star rating */
  rating: '.css-1ox41wv',

  /** Review count */
  reviewCount: '.css-1oucqh6',

  /** Product image */
  image: 'img.css-2sxpn3, img.productImage',

  /** Link to product detail page */
  link: 'a.css-qlopj4, a[href*="/p/"]',

  /** Selector to wait for before extracting */
  waitFor: '.product-list, .search-page',
};
