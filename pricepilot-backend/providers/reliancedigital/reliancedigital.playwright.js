const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/reliancedigital.selectors');
const mockProvider = require('./reliancedigital.provider');

module.exports = createProvider({
  platform: 'reliancedigital',
  selectors,
  mockFallback: mockProvider,
  category: 'Electronics',
  baseUrl: selectors.baseUrl,
  maxItems: 30
});
