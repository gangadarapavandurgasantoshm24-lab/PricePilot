const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/netmeds.selectors');
const mockProvider = require('./netmeds.provider');

module.exports = createProvider({
  platform: 'netmeds',
  selectors,
  mockFallback: mockProvider,
  category: 'Pharmacy',
  baseUrl: selectors.baseUrl,
  maxItems: 30,
  defaultBrand: 'Netmeds'
});
