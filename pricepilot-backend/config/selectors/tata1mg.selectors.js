/**
 * @module tata1mg.selectors
 * @description DOM selectors for Tata 1mg search results page.
 *
 * Phase 2 upgrades:
 *  - Multiple fallback selectors
 *  - Added offer/cashback selectors
 *  - Added baseUrl for link resolution
 *
 * Last verified: Tata 1mg search results layout (July 2026)
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.1mg.com/search/all?name=${encodeURIComponent(query)}`,

  /** Base URL for resolving relative links */
  baseUrl: 'https://www.1mg.com',

  /** Container for each search result card */
  resultItem: '[class*="style__product-box"], [class*="ProductList"], [class*="product-box"], .style__product-box__3oVgD',

  /** Product name */
  title: '[class*="style__pro-title"], [class*="product-name"], [class*="ProductName"], h3, h4',

  /** Price */
  price: '[class*="style__price-tag"], [class*="price-tag"], [class*="Price"], [class*="offer-price"]',

  /** MRP */
  originalPrice: '[class*="style__mrp"], [class*="mrp"], [class*="MRP"], [class*="strike"]',

  /** Discount */
  discount: '[class*="style__discount-percent"], [class*="discount"], [class*="off"]',

  /** Cashback / offer text */
  offer: '[class*="cashback"], [class*="offer"], [class*="coupon"], [class*="Cashback"]',

  /** Product image */
  image: 'img[class*="style__product-img"], img[loading="lazy"], img[src*="1mg"]',

  /** Link to product detail page */
  link: 'a[href*="/otc/"], a[href*="/drugs/"], a[href*="1mg"]',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], [class*="unavailable"], [class*="OutOfStock"]',

  /** Prescription indicator */
  prescriptionRequired: '[class*="rx-icon"], [class*="prescription"]',

  /** Selector to wait for before extracting */
  waitFor: '[class*="ProductList"], [class*="product-box"], [class*="searchResult"]',

  /** No results */
  noResults: '[class*="NoResult"], [class*="no-result"]',
};
