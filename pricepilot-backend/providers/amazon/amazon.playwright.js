const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/amazon.selectors');
const mockProvider = require('./amazon.mock');

module.exports = createProvider({
  platform: 'amazon',
  selectors,
  mockFallback: mockProvider,
  category: 'Electronics',
  maxItems: 30,
  defaultBrand: ''
});
