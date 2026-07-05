const products = require('../data/products');

function fetchApolloPharmacyProducts() {
  return products.filter((product) => product.store === 'Apollo Pharmacy');
}

module.exports = {
  fetchApolloPharmacyProducts
};
