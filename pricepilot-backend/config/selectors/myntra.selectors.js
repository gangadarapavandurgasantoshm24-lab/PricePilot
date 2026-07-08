/**
 * @module myntra.selectors
 * @description DOM selectors for Myntra search results page.
 *
 * Selectors are NEVER hardcoded inside provider files.
 * All Playwright providers import from config/selectors/.
 *
 * Last verified: Myntra search results layout (July 2025)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.myntra.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}`,

  /** Container for each search result card */
  resultItem: '.product-base',

  /** Product brand name */
  brand: '.product-brand',

  /** Product title / description */
  title: '.product-product',

  /** Discounted price */
  price: '.product-discountedPrice',

  /** Original price */
  originalPrice: '.product-strike',

  /** Discount percentage */
  discount: '.product-discountPercentage',

  /** Rating */
  rating: '.product-ratingsCount',

  /** Product image */
  image: '.product-imageSliderContainer img',

  /** Link to product detail page */
  link: 'a.product-base',

  /** Selector to wait for before extracting */
  waitFor: '.search-searchContainer',

  /** Load more button (for infinite scroll / pagination) */
  loadMore: '.pagination-footer .pagination-next',

  /** No results indicator */
  noResults: '.search-noResult'
};
