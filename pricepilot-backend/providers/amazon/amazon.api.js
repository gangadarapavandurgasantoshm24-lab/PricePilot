const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform: 'amazon',
  storeNames: ['Amazon', 'Amazon Pharmacy'],
  source: 'api'
});
