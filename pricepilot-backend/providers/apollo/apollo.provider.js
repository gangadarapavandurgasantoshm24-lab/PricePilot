const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'apollo',
  storeNames: ['Apollo Pharmacy'],
  source: 'api'
});
