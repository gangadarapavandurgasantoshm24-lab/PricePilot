const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'reliancedigital',
  storeNames: ['Reliance Digital'],
  source: 'api'
});
