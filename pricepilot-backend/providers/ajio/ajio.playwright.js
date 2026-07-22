const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/ajio.selectors');
const mockProvider = require('./ajio.provider');

module.exports = createProvider({
  platform: 'ajio',
  selectors,
  mockFallback: mockProvider,
  category: 'Fashion',
  baseUrl: selectors.baseUrl,
  maxItems: 30
});
