const products = require('../data/products');

function fetchMyntraProducts() {
  return products.filter((product) => product.store === 'Myntra');
}

module.exports = {
  fetchMyntraProducts
};
