const { normalizePlatform } = require('../utils/platforms');

function includesNormalized(value, expected) {
  return String(value || '').toLowerCase() === String(expected || '').toLowerCase();
}

function filterProducts(products, filters = {}) {
  return products.filter((product) => {
    if (filters.platform && normalizePlatform(product.platform) !== normalizePlatform(filters.platform)) return false;
    if (filters.brand && !includesNormalized(product.brand, filters.brand)) return false;
    if (filters.category && !String(product.category || '').toLowerCase().includes(String(filters.category).toLowerCase())) return false;
    if (filters.minPrice && product.currentPrice < Number(filters.minPrice)) return false;
    if (filters.maxPrice && product.currentPrice > Number(filters.maxPrice)) return false;
    if (filters.minRating && product.rating < Number(filters.minRating)) return false;
    if (filters.minDiscount && product.discountPercentage < Number(filters.minDiscount)) return false;
    if (filters.availability !== undefined && product.availability !== (String(filters.availability) === 'true')) return false;
    return true;
  });
}

module.exports = {
  filterProducts
};
