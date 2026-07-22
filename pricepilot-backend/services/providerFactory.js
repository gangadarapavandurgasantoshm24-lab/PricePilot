/**
 * @module providerFactory
 * @description Factory that reads config/providers.js and instantiates
 * the correct provider implementation for each platform.
 *
 * Supported strategies (set in config/providers.js):
 *   'mock'          – Local product data (Week 4 implementation)
 *   'official-api'  – Amazon Product Advertising API v5
 *   'playwright'    – Browser automation via PlaywrightProvider base class
 *
 * Week 6 additions:
 *   - myntra, purplle, meesho added to PLAYWRIGHT_PATHS
 *   - purplle and meesho added to MOCK_PATHS
 *
 * Architecture guarantee:
 *   Controllers and Platform Manager NEVER know which strategy is active.
 *   Changing a provider's strategy requires editing only config/providers.js.
 */

const providerConfig = require('../config/providers');
const logger = require('../utils/logger');

// ─── Mock provider map ────────────────────────────────────────────────────────

/**
 * Map of provider name → path to their mock implementation.
 *
 * @type {Record<string, string>}
 */
const MOCK_PATHS = {
  amazon:          '../providers/amazon/amazon.mock',
  flipkart:        '../providers/flipkart/flipkart.provider',
  nykaa:           '../providers/nykaa/nykaa.provider',
  apollo:          '../providers/apollo/apollo.provider',
  pharmeasy:       '../providers/pharmeasy/pharmeasy.provider',
  tata1mg:         '../providers/tata1mg/tata1mg.provider',
  netmeds:         '../providers/netmeds/netmeds.provider',
  bigbasket:       '../providers/bigbasket/bigbasket.provider',
  blinkit:         '../providers/blinkit/blinkit.provider',
  zepto:           '../providers/zepto/zepto.provider',
  jiomart:         '../providers/jiomart/jiomart.provider',
  myntra:          '../providers/myntra/myntra.provider',
  ajio:            '../providers/ajio/ajio.provider',
  reliancedigital: '../providers/reliancedigital/reliancedigital.provider',
  croma:           '../providers/croma/croma.provider',
  vijaysales:      '../providers/vijaysales/vijaysales.provider',
  tira:            '../providers/tira/tira.provider',
  purplle:         '../providers/purplle/purplle.provider',   // Week 6
  meesho:          '../providers/meesho/meesho.provider'      // Week 6
};

/**
 * Map of provider name → path to their official-api implementation.
 *
 * @type {Record<string, string>}
 */
const OFFICIAL_API_PATHS = {
  amazon: '../providers/amazon/amazon.official'
};

/**
 * Map of provider name → path to their Playwright implementation.
 * Week 6: myntra, purplle, meesho now have real Playwright providers.
 *
 * @type {Record<string, string>}
 */
const PLAYWRIGHT_PATHS = {
  amazon:          '../providers/amazon/amazon.playwright',
  flipkart:        '../providers/flipkart/flipkart.playwright',
  croma:           '../providers/croma/croma.playwright',
  reliancedigital: '../providers/reliancedigital/reliancedigital.playwright',
  vijaysales:      '../providers/vijaysales/vijaysales.playwright',
  myntra:          '../providers/myntra/myntra.playwright',
  ajio:            '../providers/ajio/ajio.playwright',
  meesho:          '../providers/meesho/meesho.playwright',
  nykaa:           '../providers/nykaa/nykaa.playwright',
  purplle:         '../providers/purplle/purplle.playwright',
  tira:            '../providers/tira/tira.playwright',
  apollo:          '../providers/apollo/apollo.playwright',
  pharmeasy:       '../providers/pharmeasy/pharmeasy.playwright',
  tata1mg:         '../providers/tata1mg/tata1mg.playwright',
  netmeds:         '../providers/netmeds/netmeds.playwright',
  bigbasket:       '../providers/bigbasket/bigbasket.playwright',
  blinkit:         '../providers/blinkit/blinkit.playwright',
  zepto:           '../providers/zepto/zepto.playwright',
  jiomart:         '../providers/jiomart/jiomart.playwright'
};

// ─── Strategy dispatch ────────────────────────────────────────────────────────

function loadMock(name) {
  const mockPath = MOCK_PATHS[name];
  if (!mockPath) throw new Error(`No mock implementation found for provider "${name}".`);
  return require(mockPath);
}

function loadOfficialApi(name) {
  const apiPath = OFFICIAL_API_PATHS[name];
  if (!apiPath) {
    logger.warn('Official API Provider Not Found – Falling Back to Mock', { name });
    return loadMock(name);
  }
  try {
    const provider = require(apiPath);
    logger.info('Official API Provider Loaded', {
      name,
      activeStrategy: provider._activeStrategy || 'official-api'
    });
    return provider;
  } catch (error) {
    logger.warn('Official API Provider Load Failed – Falling Back to Mock', {
      name, error: error.message
    });
    return loadMock(name);
  }
}

function loadPlaywright(name) {
  const playwrightPath = PLAYWRIGHT_PATHS[name];
  if (!playwrightPath) {
    logger.warn('Playwright Provider Not Implemented Yet – Falling Back to Mock', { name });
    return loadMock(name);
  }
  try {
    const provider = require(playwrightPath);
    logger.info('Playwright Provider Loaded', { name });
    return provider;
  } catch (error) {
    logger.warn('Playwright Provider Load Failed – Falling Back to Mock', {
      name, error: error.message
    });
    return loadMock(name);
  }
}

/**
 * Create a single provider instance by reading its configured strategy.
 *
 * @param {string} name - Provider key (e.g. 'amazon', 'myntra')
 * @returns {object} Provider instance satisfying { platform, searchProducts(query) }
 */
function createProvider(name) {
  const config = providerConfig[name];
  if (!config) throw new Error(`No configuration found for provider "${name}".`);

  const { strategy = 'mock' } = config;

  switch (strategy) {
    case 'official-api': return loadOfficialApi(name);
    case 'playwright':   return loadPlaywright(name);
    case 'mock':
    default:             return loadMock(name);
  }
}

/**
 * Create all configured providers and return a name → instance map.
 *
 * @returns {Record<string, object>}
 */
function createAll() {
  const result = {};

  Object.keys(MOCK_PATHS).forEach((name) => {
    if (!providerConfig[name]) {
      logger.warn('Provider In Factory But Not In Config – Skipped', { name });
      return;
    }
    try {
      result[name] = createProvider(name);
    } catch (error) {
      logger.error('Provider Factory Failed', { name, error: error.message });
    }
  });

  return result;
}

module.exports = { createProvider, createAll };
