const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'blinkit',
  storeNames: ['Blinkit'],
  source: 'api'
});
