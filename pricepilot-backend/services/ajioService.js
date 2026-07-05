const products = require('../data/products');

function fetchAjioProducts() {
  return products.filter((product) => product.store === 'Ajio');
}

module.exports = {
  fetchAjioProducts
};
