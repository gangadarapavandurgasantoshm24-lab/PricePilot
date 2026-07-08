/**
 * @module purplle.selectors
 * @description DOM selectors for Purplle search results page.
 *
 * Selectors are NEVER hardcoded inside provider files.
 * All Playwright providers import from config/selectors/.
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.purplle.com/search?q=${encodeURIComponent(query)}`,

  /** Container for each search result card */
  resultItem: '.product-card, [class*="ProductCard"], [class*="product-card"]',

  /** Product brand */
  brand: '[class*="brand-name"], [class*="brandName"]',

  /** Product title */
  title: '[class*="product-name"], [class*="productName"], .product-name',

  /** Current / discounted price */
  price: '[class*="product-price"] [class*="offer"], [class*="offerPrice"], .selling-price',

  /** MRP / original price */
  originalPrice: '[class*="mrp"], [class*="strikethrough"], .mrp-price',

  /** Discount text */
  discount: '[class*="discount"], [class*="off-text"]',

  /** Rating */
  rating: '[class*="rating-value"], [class*="ratingValue"]',

  /** Review count */
  reviewCount: '[class*="rating-count"], [class*="reviewCount"]',

  /** Product image */
  image: '[class*="product-img"] img, [class*="ProductImage"] img',

  /** Link to product detail page */
  link: 'a[href*="/product/"]',

  /** Out of stock badge */
  outOfStock: '[class*="out-of-stock"], [class*="outOfStock"]',

  /** Selector to wait for before extracting */
  waitFor: '[class*="ProductCard"], .product-card, .product-listing'
};
