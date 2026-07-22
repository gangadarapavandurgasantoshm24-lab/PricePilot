const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'zepto',
  storeNames: ['Zepto'],
  source: 'api'
});
