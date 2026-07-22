const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/apollo.selectors');
const mockProvider = require('./apollo.provider');

module.exports = createProvider({
  platform: 'apollo',
  selectors,
  mockFallback: mockProvider,
  category: 'Pharmacy',
  baseUrl: 'https://www.apollopharmacy.in',
  maxItems: 30,
  defaultBrand: 'Apollo Pharmacy'
});
