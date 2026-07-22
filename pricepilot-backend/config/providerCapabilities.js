/**
 * @module providerCapabilities
 * @description Category → Provider capability matrix.
 *
 * Defines which categories each provider specialises in.
 * Platform Manager uses this to select only relevant providers for a query.
 *
 * Categories:
 *   'electronics'  – phones, laptops, TVs, audio, cameras
 *   'fashion'      – clothing, shoes, bags, watches, accessories
 *   'beauty'       – cosmetics, skincare, haircare, fragrances
 *   'medicine'     – OTC drugs, vitamins, supplements, health devices
 *   'home'         – furniture, kitchen, decor, appliances
 *   'groceries'    – food, beverages, pantry items
 *   'general'      – everything that doesn't fit a specific category
 *
 * Architecture guarantee:
 *   This file is the ONLY place that maps category → provider.
 *   Platform Manager, controllers, and frontend never hardcode provider lists.
 */

/** @type {Record<string, { categories: string[], strategy: string, priority: number }>} */
const providerCapabilities = {
  amazon: {
    categories: ['electronics', 'fashion', 'beauty', 'medicine', 'home', 'groceries', 'general'],
    strategy: 'playwright',
    priority: 1,
    displayName: 'Amazon',
    baseUrl: 'https://www.amazon.in'
  },

  flipkart: {
    categories: ['electronics', 'fashion', 'home', 'general'],
    strategy: 'playwright',
    priority: 2,
    displayName: 'Flipkart',
    baseUrl: 'https://www.flipkart.com'
  },

  myntra: {
    categories: ['fashion'],
    strategy: 'playwright',
    priority: 3,
    displayName: 'Myntra',
    baseUrl: 'https://www.myntra.com'
  },

  ajio: {
    categories: ['fashion'],
    strategy: 'playwright',
    priority: 4,
    displayName: 'Ajio',
    baseUrl: 'https://www.ajio.com'
  },

  meesho: {
    categories: ['fashion', 'home', 'general'],
    strategy: 'playwright',
    priority: 5,
    displayName: 'Meesho',
    baseUrl: 'https://www.meesho.com'
  },

  nykaa: {
    categories: ['beauty'],
    strategy: 'playwright',
    priority: 6,
    displayName: 'Nykaa',
    baseUrl: 'https://www.nykaa.com'
  },

  purplle: {
    categories: ['beauty'],
    strategy: 'playwright',
    priority: 7,
    displayName: 'Purplle',
    baseUrl: 'https://www.purplle.com'
  },

  tira: {
    categories: ['beauty'],
    strategy: 'playwright',
    priority: 8,
    displayName: 'Tira Beauty',
    baseUrl: 'https://www.tirabeauty.com'
  },

  apollo: {
    categories: ['medicine'],
    strategy: 'playwright',
    priority: 9,
    displayName: 'Apollo Pharmacy',
    baseUrl: 'https://www.apollopharmacy.in'
  },

  pharmeasy: {
    categories: ['medicine'],
    strategy: 'playwright',
    priority: 10,
    displayName: 'PharmEasy',
    baseUrl: 'https://pharmeasy.in'
  },

  tata1mg: {
    categories: ['medicine'],
    strategy: 'playwright',
    priority: 11,
    displayName: 'Tata 1mg',
    baseUrl: 'https://www.1mg.com'
  },

  netmeds: {
    categories: ['medicine'],
    strategy: 'playwright',
    priority: 12,
    displayName: 'Netmeds',
    baseUrl: 'https://www.netmeds.com'
  },

  bigbasket: {
    categories: ['groceries'],
    strategy: 'playwright',
    priority: 13,
    displayName: 'BigBasket',
    baseUrl: 'https://www.bigbasket.com'
  },

  blinkit: {
    categories: ['groceries'],
    strategy: 'playwright',
    priority: 14,
    displayName: 'Blinkit',
    baseUrl: 'https://blinkit.com'
  },

  zepto: {
    categories: ['groceries'],
    strategy: 'playwright',
    priority: 15,
    displayName: 'Zepto',
    baseUrl: 'https://www.zeptonow.com'
  },

  jiomart: {
    categories: ['groceries'],
    strategy: 'playwright',
    priority: 16,
    displayName: 'JioMart',
    baseUrl: 'https://www.jiomart.com'
  },

  reliancedigital: {
    categories: ['electronics'],
    strategy: 'playwright',
    priority: 17,
    displayName: 'Reliance Digital',
    baseUrl: 'https://www.reliancedigital.in'
  },

  croma: {
    categories: ['electronics'],
    strategy: 'playwright',
    priority: 18,
    displayName: 'Croma',
    baseUrl: 'https://www.croma.com'
  },

  vijaysales: {
    categories: ['electronics'],
    strategy: 'playwright',
    priority: 19,
    displayName: 'Vijay Sales',
    baseUrl: 'https://www.vijaysales.com'
  }
};

/**
 * Get all providers that support a given category.
 * Returns all providers when category is 'general' or empty.
 *
 * @param {string} category
 * @returns {string[]} Provider names
 */
function getProvidersForCategory(category) {
  if (!category || category === 'general') {
    return Object.keys(providerCapabilities);
  }

  return Object.entries(providerCapabilities)
    .filter(([, cap]) => cap.categories.includes(category))
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([name]) => name);
}

/**
 * Get capability config for a single provider.
 *
 * @param {string} name
 * @returns {object|undefined}
 */
function getCapability(name) {
  return providerCapabilities[name];
}

module.exports = { providerCapabilities, getProvidersForCategory, getCapability };
