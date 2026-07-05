const products = require('../data/products');

function fetchTataCliqProducts() {
  return products.filter((product) => product.store === 'Tata CliQ');
}

module.exports = {
  fetchTataCliqProducts
};
