const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'myntra',
  storeNames: ['Myntra'],
  source: 'api'
});
