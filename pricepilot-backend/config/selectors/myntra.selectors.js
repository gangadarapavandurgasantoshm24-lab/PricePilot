/**
 * @module myntra.selectors
 * @description DOM selectors for Myntra search results page.
 *
 * Phase 2 upgrades:
 *  - Added discount/offer selectors
 *  - Added review count and availability selectors
 *  - Multiple fallback selectors
 *
 * Last verified: Myntra search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.myntra.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}`,

  /** Base URL for resolving relative links */
  baseUrl: 'https://www.myntra.com',

  /** Container for each search result card */
  resultItem: '.product-base, li.product-base',

  /** Product brand name */
  brand: '.product-brand, .product-brandName',

  /** Product title / description */
  title: '.product-product, .product-title, .product-productMeta p',

  /** Discounted price */
  price: '.product-discountedPrice, .product-price .discountedPrice',

  /** Original price */
  originalPrice: '.product-strike, .product-price .strike',

  /** Discount percentage */
  discount: '.product-discountPercentage, .product-discount span',

  /** Rating */
  rating: '.product-ratingsCount, .ratings-ratingsCount',

  /** Review count */
  reviewCount: '.product-userRatings, .ratings-ratingsCount',

  /** Offer / first order / coupon text */
  offer: '.product-offer, .pdp-offers-tag, .product-badge',

  /** Product image */
  image: '.product-imageSliderContainer img, img.img-responsive',

  /** Link to product detail page */
  link: 'a.product-base, a[href*="/buy/"]',

  /** Selector to wait for before extracting */
  waitFor: '.search-searchContainer, .results-container, .product-base',

  /** Load more button (for infinite scroll / pagination) */
  loadMore: '.pagination-footer .pagination-next',

  /** No results indicator */
  noResults: '.search-noResult, .noResult',

  /** Out of stock */
  outOfStock: '.product-outOfStock, [class*="out-of-stock"]',
};
