const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'tata1mg',
  storeNames: ['Tata 1mg'],
  source: 'api'
});
