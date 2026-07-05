const products = require('../data/products');

function fetchCromaProducts() {
  return products.filter((product) => product.store === 'Croma');
}

module.exports = {
  fetchCromaProducts
};
