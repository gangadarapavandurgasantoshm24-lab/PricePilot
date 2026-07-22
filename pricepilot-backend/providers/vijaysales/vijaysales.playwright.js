const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/vijaysales.selectors');
const mockProvider = require('./vijaysales.provider');

module.exports = createProvider({
  platform: 'vijaysales',
  selectors,
  mockFallback: mockProvider,
  category: 'Electronics',
  baseUrl: selectors.baseUrl,
  maxItems: 30
});
