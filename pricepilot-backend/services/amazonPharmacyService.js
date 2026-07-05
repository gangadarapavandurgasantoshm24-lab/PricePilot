const products = require('../data/products');

function fetchAmazonPharmacyProducts() {
  return products.filter((product) => product.store === 'Amazon Pharmacy');
}

module.exports = {
  fetchAmazonPharmacyProducts
};
