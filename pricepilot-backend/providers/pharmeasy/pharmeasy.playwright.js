const createProvider = require('../base/createSearchPlaywrightProvider');
const selectors = require('../../config/selectors/pharmeasy.selectors');
const mockProvider = require('./pharmeasy.provider');

module.exports = createProvider({
  platform: 'pharmeasy',
  selectors,
  mockFallback: mockProvider,
  category: 'Pharmacy',
  baseUrl: 'https://pharmeasy.in',
  maxItems: 30,
  defaultBrand: 'PharmEasy'
});
