const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'jiomart',
  storeNames: ['JioMart'],
  source: 'api'
});
