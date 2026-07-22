const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/bigbasket.selectors');
const mockProvider = require('./bigbasket.provider');

module.exports = createProvider({
  platform: 'bigbasket',
  selectors,
  mockFallback: mockProvider,
  category: 'Groceries',
  baseUrl: selectors.baseUrl,
  maxItems: 30
});
