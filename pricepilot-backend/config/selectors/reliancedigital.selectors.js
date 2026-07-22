/**
 * @module reliancedigital.selectors
 * @description DOM selectors for Reliance Digital search results page.
 *
 * Phase 2 upgrades:
 *  - More specific selectors with multiple fallbacks
 *  - Added EMI/bank offer selectors
 *  - Added delivery and out-of-stock selectors
 *
 * Last verified: Reliance Digital search results layout (July 2026)
 */

module.exports = {
  /** Base URL */
  baseUrl: 'https://www.reliancedigital.in',

  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`,

  /** Container for each search result card */
  resultItem: 'li.pl__item:has(a[href*="/p/"]), .product-item:has(a[href*="/p/"]), [class*="product-item"]:has(a[href*="/p/"]), [class*="ProductItem"]:has(a[href*="/p/"]), a[href*="/p/"]:has(img)',

  /** Brand */
  brand: '[class*="brand"], .pl__brand, [class*="Brand"]',

  /** Product title */
  title: 'p.sp__name, .product-name, [class*="product-name"], [class*="ProductName"], h3, h4, a[href*="/p/"]',

  /** Current price */
  price: 'span.pd__price, .product-price strong, [class*="pd__price"], [class*="offer-price"]',

  /** Original price / MRP */
  originalPrice: 'span.pd__price--strike, [class*="strike"], [class*="mrp"]',

  /** Discount */
  discount: '[class*="discount"], [class*="off"], [class*="savings"]',

  /** Rating */
  rating: '[class*="rating"], [aria-label*="rating"], .ratingContainer',

  /** Review count */
  reviewCount: '[class*="review"], [class*="ratingCount"]',

  /** Product image */
  image: 'img[class*="productImage"], img[src*="reliancedigital"], img.product-image, img[loading="lazy"]',

  /** Link to product detail page */
  link: 'a[href*="/p/"], a.product-link, li.pl__item > a',

  /** Delivery / EMI / bank offer */
  delivery: '[class*="delivery"], [class*="emi"], [class*="EMI"]',

  /** Offer text */
  offer: '[class*="offer"], [class*="bank"], [class*="cashback"], [class*="discount-tag"]',

  /** Out of stock */
  outOfStock: '[class*="out-of-stock"], [class*="unavailable"], [class*="soldOut"]',

  /** Selector to wait for before extracting */
  waitFor: 'a[href*="/p/"], .product-item, li.pl__item, [class*="product-listing"]',
};
