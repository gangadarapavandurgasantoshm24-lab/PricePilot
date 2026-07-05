const products = require('../data/products');

function fetchFlipkartProducts() {
  return products.filter((product) => product.store === 'Flipkart');
}

module.exports = {
  fetchFlipkartProducts
};
