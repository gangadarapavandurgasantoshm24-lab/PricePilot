const products = require('../data/products');

function fetchNykaaProducts() {
  return products.filter((product) => product.store === 'Nykaa');
}

module.exports = {
  fetchNykaaProducts
};
