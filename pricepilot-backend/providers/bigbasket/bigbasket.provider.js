const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'bigbasket',
  storeNames: ['BigBasket'],
  source: 'api'
});
