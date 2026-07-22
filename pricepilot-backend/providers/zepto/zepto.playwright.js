const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/zepto.selectors');
const mockProvider = require('./zepto.provider');

module.exports = createProvider({
  platform: 'zepto',
  selectors,
  mockFallback: mockProvider,
  category: 'Groceries',
  baseUrl: selectors.baseUrl,
  maxItems: 30
});
