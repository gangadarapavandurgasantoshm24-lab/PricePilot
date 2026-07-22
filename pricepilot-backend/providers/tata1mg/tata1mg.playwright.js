const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/tata1mg.selectors');
const mockProvider = require('./tata1mg.provider');

module.exports = createProvider({
  platform: 'tata1mg',
  selectors,
  mockFallback: mockProvider,
  category: 'Pharmacy',
  baseUrl: selectors.baseUrl,
  maxItems: 30,
  defaultBrand: 'Tata 1mg'
});
