/**
 * Amazon Mock Provider – Week 5
 *
 * This is the mock fallback used when:
 *  - strategy = 'mock' in config/providers.js
 *  - AMAZON_ACCESS_KEY is not configured in .env
 *  - The official API provider fails to initialise
 *
 * Content is identical to the original amazon.api.js — renamed to make
 * the strategy naming explicit (mock vs official-api vs playwright).
 */

const createLocalProductProvider = require('../localProductProviderFactory');

module.exports = createLocalProductProvider({
  platform:   'amazon',
  storeNames: ['Amazon', 'Amazon Pharmacy'],
  source:     'mock'
});
