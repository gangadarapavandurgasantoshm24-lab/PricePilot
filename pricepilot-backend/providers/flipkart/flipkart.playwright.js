const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/flipkart.selectors');
const mockProvider = require('./flipkart.provider');

module.exports = createProvider({
  platform: 'flipkart',
  selectors,
  mockFallback: mockProvider,
  category: 'Electronics',
  baseUrl: 'https://www.flipkart.com',
  maxItems: 30
});
