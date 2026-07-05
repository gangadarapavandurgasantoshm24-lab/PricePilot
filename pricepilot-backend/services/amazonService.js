const products = require('../data/products');

function fetchAmazonProducts() {
  return products.filter((product) => product.store === 'Amazon');
}

module.exports = {
  fetchAmazonProducts
};
