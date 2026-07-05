const { fetchAmazonProducts } = require('./amazonService');
const { fetchFlipkartProducts } = require('./flipkartService');
const { fetchMyntraProducts } = require('./myntraService');
const { fetchNykaaProducts } = require('./nykaaService');
const { fetchCromaProducts } = require('./cromaService');
const { fetchAjioProducts } = require('./ajioService');
const { fetchRelianceDigitalProducts } = require('./relianceDigitalService');
const { fetchTataCliqProducts } = require('./tataCliqService');
const { fetchApolloPharmacyProducts } = require('./apolloPharmacyService');
const { fetchPharmEasyProducts } = require('./pharmEasyService');
const { fetchNetmedsProducts } = require('./netmedsService');
const { fetchAmazonPharmacyProducts } = require('./amazonPharmacyService');

function fetchAllMarketplaceProducts() {
  return [
    ...fetchAmazonProducts(),
    ...fetchFlipkartProducts(),
    ...fetchMyntraProducts(),
    ...fetchNykaaProducts(),
    ...fetchCromaProducts(),
    ...fetchAjioProducts(),
    ...fetchRelianceDigitalProducts(),
    ...fetchTataCliqProducts(),
    ...fetchApolloPharmacyProducts(),
    ...fetchPharmEasyProducts(),
    ...fetchNetmedsProducts(),
    ...fetchAmazonPharmacyProducts()
  ];
}

module.exports = {
  fetchAllMarketplaceProducts
};
