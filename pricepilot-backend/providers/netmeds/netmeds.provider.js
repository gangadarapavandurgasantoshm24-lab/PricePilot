const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'netmeds',
  storeNames: ['Netmeds'],
  source: 'api'
});
