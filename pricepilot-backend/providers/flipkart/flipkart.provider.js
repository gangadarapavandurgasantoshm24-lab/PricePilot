const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'flipkart',
  storeNames: ['Flipkart'],
  source: 'api'
});
