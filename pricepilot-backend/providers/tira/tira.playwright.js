const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/tira.selectors');
const mockProvider = require('./tira.provider');

module.exports = createProvider({
  platform: 'tira',
  selectors,
  mockFallback: mockProvider,
  category: 'Beauty',
  baseUrl: selectors.baseUrl,
  maxItems: 30
});
