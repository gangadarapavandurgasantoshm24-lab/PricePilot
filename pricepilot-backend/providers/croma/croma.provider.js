const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'croma',
  storeNames: ['Croma'],
  source: 'api'
});
