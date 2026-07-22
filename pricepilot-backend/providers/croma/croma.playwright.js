const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/croma.selectors');
const mockProvider = require('./croma.provider');

module.exports = createProvider({
  platform: 'croma',
  selectors,
  mockFallback: mockProvider,
  category: 'Electronics',
  baseUrl: selectors.baseUrl,
  maxItems: 30
});
