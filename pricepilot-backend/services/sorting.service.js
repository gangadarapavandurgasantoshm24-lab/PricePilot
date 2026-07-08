/**
 * @module sortingService
 * @description Reusable, testable sorting engine for product arrays.
 *
 * Supported sort keys
 *  - lowestPrice      → lowest finalPayablePrice first  (default)
 *  - lowestListingPrice → lowest currentPrice first
 *  - highestRating    → highest rating first
 *  - highestDiscount  → highest discountPercentage first
 *  - platform         → alphabetical by platform name
 *  - alphabetical     → alphabetical by productName
 *  - newest           → most-recently fetched first
 */

/** @type {Record<string, Function>} */
const SORTERS = {
  lowestPrice: (a, b) => a.finalPayablePrice - b.finalPayablePrice,
  lowestListingPrice: (a, b) => a.currentPrice - b.currentPrice,
  highestRating: (a, b) => b.rating - a.rating,
  highestDiscount: (a, b) => b.discountPercentage - a.discountPercentage,
  platform: (a, b) => String(a.platform || '').localeCompare(String(b.platform || '')),
  alphabetical: (a, b) => String(a.productName || '').localeCompare(String(b.productName || '')),
  newest: (a, b) => new Date(b.fetchedAt || 0) - new Date(a.fetchedAt || 0)
};

/**
 * Sort a product array by the given key.
 *
 * @param {Array<object>} products - Normalised product objects
 * @param {string} [sortBy='lowestPrice'] - Sort key
 * @returns {Array<object>} New sorted array (original is not mutated)
 */
function sortProducts(products, sortBy = 'lowestPrice') {
  const comparator = SORTERS[sortBy] || SORTERS.lowestPrice;
  return [...products].sort(comparator);
}

/**
 * Return the list of valid sort keys.
 *
 * @returns {string[]}
 */
function validSortKeys() {
  return Object.keys(SORTERS);
}

module.exports = {
  sortProducts,
  validSortKeys
};
