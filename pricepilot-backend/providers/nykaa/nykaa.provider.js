const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'nykaa',
  storeNames: ['Nykaa'],
  source: 'api'
});
