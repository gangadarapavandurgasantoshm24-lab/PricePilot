const products = require('../data/products');

function fetchPharmEasyProducts() {
  return products.filter((product) => product.store === 'PharmEasy');
}

module.exports = {
  fetchPharmEasyProducts
};
