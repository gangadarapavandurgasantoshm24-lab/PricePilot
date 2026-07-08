/**
 * @module platforms
 * @description Shared platform name normalisation utilities.
 *
 * Keeps alias resolution in one place so filtering, sorting, and the
 * platform manager all use identical logic.
 */

const PLATFORM_ALIASES = {
  'reliance-digital': 'reliancedigital',
  reliance: 'reliancedigital',
  'tata-1mg': 'tata1mg',
  '1mg': 'tata1mg',
  'apollo-pharmacy': 'apollo',
  amazonpharmacy: 'amazon'
};

/**
 * Convert a raw platform string to its canonical registry key.
 *
 * @param {string} platform
 * @returns {string}
 */
function normalizePlatform(platform) {
  const key = String(platform || '').trim().toLowerCase().replace(/\s+/g, '');
  return PLATFORM_ALIASES[key] || key;
}

module.exports = { normalizePlatform };
