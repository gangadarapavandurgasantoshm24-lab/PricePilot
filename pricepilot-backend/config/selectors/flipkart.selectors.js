/**
 * @module flipkart.selectors
 * @description DOM selectors for Flipkart search results page.
 *
 * Phase 2 upgrades:
 *  - Multiple CSS class fallbacks (Flipkart uses obfuscated/hashed classes)
 *  - Added offer, coupon, bank-offer selectors
 *  - Added delivery and availability selectors
 *
 * Last verified: Flipkart search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&otracker=search&otracker1=search&marketplace=FLIPKART`,

  /** Base URL for resolving relative links */
  baseUrl: 'https://www.flipkart.com',

  /** Container for each search result card — multiple fallbacks */
  resultItem: '._1AtVbE, ._2kHMtA, .CXW8mj, ._4ddWXP, [data-id], div[class*="col"]:has(a[href*="/p/"])',

  /** Product title */
  title: '._4rR01T, .s1Q9rs, ._2WkVRV, a.IRpwTa, .wjcEIp, ._3pLy-c, div[class*="KzDlHZ"]',

  /** Final price (after discounts) */
  price: '._30jeq3, ._1vC4OE, .Nx9bqj, ._3tbKJL, div[class*="Nx9bqj"]',

  /** Original price (before discount) */
  originalPrice: '._3I9_wc, ._27UcVY, .yRaY8j, .CEmiEU',

  /** Discount percentage text */
  discount: '._3Ay6Sb, ._3xINlB, .UkUFwK, ._1jldxD',

  /** Star rating */
  rating: '._3LWZlK, ._3RNUmz, .XQDdHH, ._1lRcqv',

  /** Review count */
  reviewCount: '._2_R_DZ, ._2pYMLU, .Wphh3N span',

  /** Product image */
  image: '._396cs4, ._2r_T1I, img[src*="rukminim"], img.DByuf4, img._2r_T1I',

  /** Link to product detail page (relative, prepend https://www.flipkart.com) */
  link: 'a._1fQZEK, a.s1Q9rs, a.IRpwTa, a.CGtC98, a._2rpwqI, a[href*="/p/"]',

  /** Free delivery badge */
  delivery: '._3tcKJj, ._3qQ9m1, .yiggsN, ._6d3obJ, [id*="emi"], [class*="delivery"]',

  /** Offer/coupon text */
  offer: '._1LKTO3, ._3ihcN2, [class*="offer"], .jLtMYL',

  /** Bank offer row */
  bankOffer: '[class*="EMI"], [class*="offer"], ._2AkmmA',

  /** Availability indicator */
  availability: '._2eoM5u, ._1e0EHM',

  /** Selector to wait for before extracting */
  waitFor: '._1YokD2, ._3pLy-c, ._2B099V, [class*="DOjaWF"]',

  /** No results indicator */
  noResults: '._3O0U0u, [class*="no-result"]',
};
