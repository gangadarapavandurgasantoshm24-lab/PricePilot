const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'tira',
  storeNames: ['Tira'],
  source: 'api'
});
