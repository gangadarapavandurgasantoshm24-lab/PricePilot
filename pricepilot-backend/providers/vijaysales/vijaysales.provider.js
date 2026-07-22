const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'vijaysales',
  storeNames: ['Vijay Sales'],
  source: 'api'
});
