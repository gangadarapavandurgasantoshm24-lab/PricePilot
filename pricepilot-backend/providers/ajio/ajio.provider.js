const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'ajio',
  storeNames: ['Ajio'],
  source: 'api'
});
