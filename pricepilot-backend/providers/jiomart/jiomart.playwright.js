const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/jiomart.selectors');
const mockProvider = require('./jiomart.provider');

module.exports = createProvider({
  platform: 'jiomart',
  selectors,
  mockFallback: mockProvider,
  category: 'Groceries',
  baseUrl: selectors.baseUrl,
  maxItems: 30
});
