const products = require('../data/products');
const { normalizeText } = require('../utils/helpers');
const { normalizeProduct } = require('../services/normalization.service');

function getSearchTerms(query) {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

function productMatchesQuery(product, query) {
  const terms = getSearchTerms(query);
  const searchableText = normalizeText([
    product.title,
    product.brand,
    product.category,
    product.store
  ].join(' '));

  return terms.every((term) => searchableText.includes(term));
}

function createLocalProductProvider({ platform, storeNames, source = 'api' }) {
  return {
    platform,
    source,
    async searchProducts(query) {
      const normalizedStores = storeNames.map(normalizeText);

      return products
        .filter((product) => normalizedStores.includes(normalizeText(product.store)))
        .filter((product) => productMatchesQuery(product, query))
        .map((product) => normalizeProduct(product, platform, source));
    }
  };
}

module.exports = createLocalProductProvider;
