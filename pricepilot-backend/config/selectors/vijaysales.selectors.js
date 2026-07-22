/**
 * @module vijaysales.selectors
 * @description DOM selectors for Vijay Sales search results page.
 *
 * Phase 2 upgrades:
 *  - More specific selectors with multiple fallbacks
 *  - Added offer/bank-offer selectors
 *
 * Last verified: Vijay Sales search results layout (July 2026)
 */

module.exports = {
  /** Base URL */
  baseUrl: 'https://www.vijaysales.com',

  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.vijaysales.com/search/${encodeURIComponent(query.replace(/\s+/g, '-'))}`,

  /** Container for each search result card */
  resultItem: 'a[href*="/buy/"]:has(img), .product-list-item:has(a[href*="/buy/"]), [class*="ProductCard"]:has(a[href*="/buy/"]), .product-card:has(a[href*="/buy/"]), [class*="product-tile"]:has(a[href*="/buy/"])',

  /** Brand */
  brand: '[class*="brand"], .product-brand',

  /** Product title */
  title: '.product-title, [class*="product-name"], [class*="ProductName"], h3, h2, a[href*="/buy/"]',

  /** Current price */
  price: '.special-price, [class*="special-price"], [class*="offer-price"], .price-value, [class*="price"]:not([class*="filter"])',

  /** Original price */
  originalPrice: '.regular-price, [class*="regular-price"], [class*="mrp"], .old-price',

  /** Discount */
  discount: '[class*="discount"], [class*="off"], .savings',

  /** Rating */
  rating: '[class*="rating"], [aria-label*="star"], .star-rating',

  /** Review count */
  reviewCount: '[class*="review-count"], [class*="rating-count"]',

  /** Product image */
  image: 'img.product-image, img[src*="vijaysales"], img[loading="lazy"], img',

  /** Link */
  link: 'a[href*="/buy/"], a.product-link, [class*="ProductCard"] > a',

  /** Delivery / offer / bank offer */
  delivery: '[class*="delivery"], [class*="offer"], [class*="emi"]',

  /** Offer text */
  offer: '[class*="offer"], [class*="bank-offer"], [class*="cashback"]',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], .out-of-stock',

  /** Selector to wait for before extracting */
  waitFor: 'a[href*="/buy/"], .product-list-item, [class*="ProductCard"], [class*="product-list"]',
};
