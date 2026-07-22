const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/nykaa.selectors');
const mockProvider = require('./nykaa.provider');

module.exports = createProvider({
  platform: 'nykaa',
  selectors,
  mockFallback: mockProvider,
  category: 'Beauty',
  baseUrl: 'https://www.nykaa.com',
  maxItems: 30
});
