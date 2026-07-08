const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'pharmeasy',
  storeNames: ['PharmEasy'],
  source: 'api'
});
