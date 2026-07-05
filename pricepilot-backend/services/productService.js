const { fetchAllMarketplaceProducts } = require('./marketplaceService');
const { formatProduct, formatComparisonProduct } = require('../utils/formatProduct');

function normalize(value) {
  return value.toString().trim().toLowerCase();
}

function getSearchTerms(query) {
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean);
}

function productMatchesQuery(product, query) {
  const terms = getSearchTerms(query);
  const searchableText = normalize([
    product.title,
    product.brand,
    product.category,
    product.store
  ].join(' '));

  return terms.every((term) => searchableText.includes(term));
}

function getMatchingProducts(query) {
  if (!query || !query.trim()) {
    return [];
  }

  return fetchAllMarketplaceProducts()
    .filter((product) => productMatchesQuery(product, query))
    .map(formatProduct)
    .sort((first, second) => first.finalPayablePrice - second.finalPayablePrice);
}

function searchProducts(query) {
  return getMatchingProducts(query);
}

function compareProducts(query) {
  return getMatchingProducts(query).map(formatComparisonProduct);
}

function getProductById(id) {
  const products = fetchAllMarketplaceProducts();
  const product = products.find((item) => item.id === Number(id));

  if (!product) {
    return null;
  }

  return formatProduct(product);
}

module.exports = {
  searchProducts,
  compareProducts,
  getProductById
};
