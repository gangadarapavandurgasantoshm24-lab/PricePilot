const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/blinkit.selectors');
const mockProvider = require('./blinkit.provider');

module.exports = createProvider({
  platform: 'blinkit',
  selectors,
  mockFallback: mockProvider,
  category: 'Groceries',
  baseUrl: selectors.baseUrl,
  maxItems: 30
});
