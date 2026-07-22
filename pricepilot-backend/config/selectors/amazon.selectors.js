/**
 * @module amazon.selectors
 * @description DOM selectors for Amazon India search results page.
 *
 * Phase 2 upgrades:
 *  - Added offer/bank-offer selectors for real-time extraction
 *  - Multiple fallback selectors for price, title, link
 *  - Added delivery and badge selectors
 *
 * Last verified: Amazon India search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.amazon.in/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`,

  /** Base URL for resolving relative links */
  baseUrl: 'https://www.amazon.in',

  /** Container for each search result card */
  resultItem: '[data-component-type="s-search-result"]:not([data-component-type="sp-sponsored-result"])',

  /** Product title text */
  title: 'h2 a span, h2 span.a-text-normal, h2 .a-size-medium, a.a-link-normal h2, h2',

  /** Price (first offscreen span inside .a-price) */
  price: '.a-price:not(.a-text-price) .a-offscreen, .a-price .a-offscreen',

  /** Original / crossed-out price */
  originalPrice: '.a-price.a-text-price .a-offscreen, .a-text-price .a-offscreen',

  /** Discount percentage */
  discount: '.a-row .a-color-price, .savingsPercentage',

  /** Star rating text (e.g. "4.3 out of 5 stars") */
  rating: '.a-icon-alt, .a-icon-star-small .a-icon-alt',

  /** Review count */
  reviewCount: '.a-size-small .a-link-normal, [aria-label*="ratings"], [aria-label*="reviews"]',

  /** Product image */
  image: '.s-image, img.s-product-image-container',

  /** Link to product detail page */
  link: 'h2 a, a.a-link-normal.s-no-outline',

  /** Delivery text for free delivery detection */
  delivery: '[data-cy="delivery-recipe-container"] span, .a-color-base.a-text-bold, .s-align-children-center span',

  /** Offer / bank offer text */
  offer: '.a-row .a-color-secondary, [data-cy="secondary-offer-recipe"] span, .a-color-price small',

  /** Bank offer badge */
  bankOffer: '[data-cy="secondary-offer-recipe"], .a-row.a-size-base.a-color-secondary',

  /** Prime badge */
  prime: '.a-icon-prime',

  /** Sponsoring label (filter out ads) */
  sponsored: '[data-component-type="sp-sponsored-result"]',

  /** Out of stock text */
  outOfStock: '.a-color-error',

  /** Selector to wait for before extracting (page is loaded) */
  waitFor: '.s-main-slot, .s-search-results',

  /** No results indicator */
  noResults: '[data-cel-widget*="MAIN-SEARCH_RESULTS"] h2.a-size-medium-plus, .s-no-results-result',
};
