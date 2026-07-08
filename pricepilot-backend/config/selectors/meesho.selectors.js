/**
 * @module meesho.selectors
 * @description DOM selectors for Meesho search results page.
 *
 * Selectors are NEVER hardcoded inside provider files.
 * All Playwright providers import from config/selectors/.
 */

module.exports = {
  /** Build the search URL for a given query */
  searchUrl: (query) =>
    `https://www.meesho.com/search?q=${encodeURIComponent(query)}`,

  /** Container for each search result card */
  resultItem: '[class*="ProductList"] [class*="Card"], [data-testid="product-container"]',

  /** Product title */
  title: '[class*="ProductTitle"], [class*="product-title"], h5',

  /** Supplier / brand name */
  brand: '[class*="Supplier"], [class*="supplier-name"], [class*="brandName"]',

  /** Discounted price */
  price: '[class*="PriceContainer"] h5, [class*="discounted-price"]',

  /** Original price */
  originalPrice: '[class*="OriginalPrice"], [class*="original-price"]',

  /** Discount percentage */
  discount: '[class*="Discount"], [class*="discount-label"]',

  /** Rating */
  rating: '[class*="RatingBadge"] p, [class*="rating"]',

  /** Review count */
  reviewCount: '[class*="RatingCount"], [class*="review-count"]',

  /** Product image */
  image: '[class*="ProductImage"] img, [class*="product-image"] img',

  /** Link to product detail page */
  link: 'a[href*="/product/"]',

  /** Out of stock indicator */
  outOfStock: '[class*="OutOfStock"]',

  /** Selector to wait for before extracting */
  waitFor: '[class*="ProductList"], [data-testid="product-container"]'
};
