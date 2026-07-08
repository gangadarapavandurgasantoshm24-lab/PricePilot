/**
 * @module amazon.selectors
 * @description DOM selectors for Amazon India search results page.
 *
 * Selectors are NEVER hardcoded inside provider files.
 * All Playwright providers import from config/selectors/.
 *
 * Last verified: Amazon India search results layout (July 2025)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.amazon.in/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`,

  /** Container for each search result card */
  resultItem: '[data-component-type="s-search-result"]',

  /** Product title text */
  title: 'h2 a span',

  /** Price (first offscreen span inside .a-price) */
  price: '.a-price .a-offscreen',

  /** Original / crossed-out price */
  originalPrice: '.a-price.a-text-price .a-offscreen',

  /** Star rating text (e.g. "4.3 out of 5 stars") */
  rating: '.a-icon-alt',

  /** Review count */
  reviewCount: '.a-size-small .a-link-normal',

  /** Product image */
  image: '.s-image',

  /** Link to product detail page */
  link: 'h2 a',

  /** Prime badge */
  prime: '.a-icon-prime',

  /** Delivery text */
  delivery: '.a-color-base.a-text-bold',

  /** Sponsoring label (to filter out ads if needed) */
  sponsored: '[data-component-type="sp-sponsored-result"]',

  /** Selector to wait for before extracting (page is loaded) */
  waitFor: '.s-main-slot',
};
