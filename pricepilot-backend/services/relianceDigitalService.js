const products = require('../data/products');

function fetchRelianceDigitalProducts() {
  return products.filter((product) => product.store === 'Reliance Digital');
}

module.exports = {
  fetchRelianceDigitalProducts
};
