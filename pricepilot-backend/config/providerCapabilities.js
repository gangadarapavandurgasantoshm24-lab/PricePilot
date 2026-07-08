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
    categories: ['electronics', 'fashion', 'beauty', 'home', 'groceries', 'general'],
    strategy: 'official-api',
    priority: 1,
    displayName: 'Amazon',
    baseUrl: 'https://www.amazon.in'
  },

  flipkart: {
    categories: ['electronics', 'fashion', 'home', 'general'],
    strategy: 'mock',
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
    strategy: 'mock',
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
    strategy: 'mock',
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

  apollo: {
    categories: ['medicine'],
    strategy: 'mock',
    priority: 8,
    displayName: 'Apollo Pharmacy',
    baseUrl: 'https://www.apollopharmacy.in'
  },

  pharmeasy: {
    categories: ['medicine'],
    strategy: 'mock',
    priority: 9,
    displayName: 'PharmEasy',
    baseUrl: 'https://pharmeasy.in'
  },

  tata1mg: {
    categories: ['medicine'],
    strategy: 'mock',
    priority: 10,
    displayName: 'Tata 1mg',
    baseUrl: 'https://www.1mg.com'
  },

  reliancedigital: {
    categories: ['electronics'],
    strategy: 'mock',
    priority: 11,
    displayName: 'Reliance Digital',
    baseUrl: 'https://www.reliancedigital.in'
  },

  croma: {
    categories: ['electronics'],
    strategy: 'mock',
    priority: 12,
    displayName: 'Croma',
    baseUrl: 'https://www.croma.com'
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
