const products = require('../data/products');

function fetchNetmedsProducts() {
  return products.filter((product) => product.store === 'Netmeds');
}

module.exports = {
  fetchNetmedsProducts
};
