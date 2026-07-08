/**
 * @module platformManager
 * @description Provider Execution Manager – orchestrates all platform providers.
 *
 * Architecture guarantees:
 *  - Controllers NEVER know where data comes from (mock vs real API vs Playwright)
 *  - The Provider Interface NEVER changes
 *  - One failed provider NEVER stops the search
 *  - Per-provider timeout, retries, and error isolation
 *  - Week 6: Category-aware routing via categoryDetector + providerCapabilities
 *
 * Adding a new provider requires only:
 *   1. A new provider file
 *   2. An entry in config/providers.js
 *   3. An entry in config/providerCapabilities.js
 *   No changes here.
 */

const providerRegistry  = require('./providerRegistry');
const providerFactory   = require('./providerFactory');
const cacheService      = require('./cache.service');
const analyticsService  = require('./analytics.service');
const { filterProducts } = require('./filtering.service');
const { sortProducts }  = require('./sorting.service');
const { filterValidProducts } = require('../utils/productValidator');
const { detectCategory, getCategoryLabel } = require('./categoryDetector');
const { getProvidersForCategory } = require('../config/providerCapabilities');
const logger             = require('../utils/logger');
const { SUPPORTED_PLATFORMS } = require('../config/constants');

// ─── Bootstrap: register all providers via Factory ────────────────────────────

(function registerAllProviders() {
  const providerMap = providerFactory.createAll();

  Object.entries(providerMap).forEach(([name, provider]) => {
    try {
      providerRegistry.register(name, provider);
    } catch (error) {
      logger.error('Provider Registration Failed', { name, message: error.message });
    }
  });
}());


// ─── Platform helpers ────────────────────────────────────────────────────────

const PLATFORM_ALIASES = {
  'reliance-digital': 'reliancedigital',
  reliance: 'reliancedigital',
  'tata-1mg': 'tata1mg',
  '1mg': 'tata1mg',
  'apollo-pharmacy': 'apollo',
  amazonpharmacy: 'amazon'
};

/**
 * Normalise a platform name to its canonical key.
 *
 * @param {string} platform
 * @returns {string}
 */
function normalizePlatform(platform) {
  const key = String(platform || '').trim().toLowerCase().replace(/\s+/g, '');
  return PLATFORM_ALIASES[key] || key;
}

/**
 * Check whether a platform name resolves to a registered provider.
 *
 * @param {string} platform
 * @returns {boolean}
 */
function isSupportedPlatform(platform) {
  return providerRegistry.isRegistered(normalizePlatform(platform));
}

// ─── Duplicate detection (Step 10 – enhanced) ───────────────────────────────

/**
 * Normalise a string to a stable token for duplicate detection:
 * lowercase, strip symbols, collapse spaces.
 *
 * @param {string} value
 * @returns {string}
 */
function dedup(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove duplicate products using a platform + brand + name composite key.
 * Normalises spaces, case, and symbols before comparison.
 *
 * @param {Array<object>} products
 * @returns {Array<object>}
 */
function removeDuplicates(products) {
  const seen = new Set();

  return products.filter((product) => {
    const key = [
      dedup(product.platform),
      dedup(product.brand),
      dedup(product.productName)
    ].join(':');

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Provider execution ──────────────────────────────────────────────────────

/**
 * Execute a single provider with its configured timeout.
 * Times out after providerConfig.timeout milliseconds.
 *
 * @param {object} instance  - Provider instance
 * @param {object} config    - Provider config (timeout, retries, strategy)
 * @param {string} query     - Search query
 * @returns {Promise<Array<object>>}
 */
function withProviderTimeout(instance, config, query) {
  return Promise.race([
    instance.searchProducts(query),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${instance.platform} timed out after ${config.timeout}ms`)),
        config.timeout
      )
    )
  ]);
}

/**
 * Execute a provider with per-provider retries and health tracking.
 *
 * @param {string} name      - Provider key
 * @param {object} instance  - Provider instance
 * @param {object} config    - Provider config
 * @param {string} query     - Search query
 * @returns {Promise<{platform, name, success, count, executionTimeMs, strategy, products, error?}>}
 */
async function executeProvider(name, instance, config, query) {
  const startedAt = Date.now();
  let lastError;

  for (let attempt = 0; attempt <= config.retries; attempt += 1) {
    logger.info('Provider Started', {
      platform: instance.platform,
      attempt: attempt + 1,
      strategy: config.strategy
    });

    try {
      const rawProducts = await withProviderTimeout(instance, config, query);
      const validProducts = filterValidProducts(rawProducts);
      const executionTimeMs = Date.now() - startedAt;

      providerRegistry.recordSuccess(name, executionTimeMs);

      logger.info('Provider Finished', {
        platform: instance.platform,
        totalFetched: rawProducts.length,
        validProducts: validProducts.length,
        executionTimeMs
      });

      return {
        platform: instance.platform,
        name,
        success: true,
        count: validProducts.length,
        executionTimeMs,
        strategy: config.strategy,
        products: validProducts
      };
    } catch (error) {
      lastError = error;
      logger.error('Provider Error', {
        platform: instance.platform,
        attempt: attempt + 1,
        message: error.message
      });

      if (attempt < config.retries) {
        const waitMs = 250 * Math.pow(2, attempt);
        logger.warn('Provider Retry', {
          platform: instance.platform,
          nextAttempt: attempt + 2,
          waitMs
        });
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  const executionTimeMs = Date.now() - startedAt;
  providerRegistry.recordFailure(name, lastError.message);

  logger.warn('Provider Skipped After Retries', {
    platform: instance.platform,
    retries: config.retries,
    executionTimeMs,
    message: lastError.message
  });

  return {
    platform: instance.platform,
    name,
    success: false,
    count: 0,
    executionTimeMs,
    strategy: config.strategy,
    error: lastError.message,
    products: []
  };
}

// ─── Core search ─────────────────────────────────────────────────────────────

/**
 * Run a search across all enabled providers (or a single platform).
 *
 * Uses Promise.allSettled so one provider crashing never blocks the rest.
 *
 * @param {string} query   - User search term
 * @param {object} options - { platform, sortBy, brand, minPrice, maxPrice, minRating, availability, category }
 * @returns {Promise<object>}
 */
async function searchAllPlatforms(query, options = {}) {
  const startedAt = Date.now();

  // Destructure pagination options
  const page  = Math.max(1, Number(options.page)  || 1);
  const limit = Math.max(1, Number(options.limit) || 20);

  // ── Category detection & routing ─────────────────────────────────────────
  // If the caller supplied an explicit category, use it.
  // Otherwise detect category from the query text.
  const detectedCategory = options.category || detectCategory(query);

  // Select providers
  const allEnabled = providerRegistry.getEnabledProviders();

  // Priority filter chain:
  //   1. If options.platform is set → that single platform only
  //   2. If category resolved → providers that support that category
  //   3. Otherwise → all enabled providers
  let selectedProviders;
  if (options.platform) {
    selectedProviders = allEnabled.filter(
      ({ name }) => name === normalizePlatform(options.platform)
    );
  } else if (detectedCategory && detectedCategory !== 'general') {
    const capableNames = getProvidersForCategory(detectedCategory);
    selectedProviders  = allEnabled.filter(({ name }) => capableNames.includes(name));
    // Fall back to all providers if capability matrix returns nothing registered
    if (selectedProviders.length === 0) selectedProviders = allEnabled;
  } else {
    selectedProviders = allEnabled;
  }

  if (selectedProviders.length === 0) {
    return {
      success: false,
      query,
      cached: false,
      page,
      limit,
      totalPlatforms: 0,
      totalResults: 0,
      hasNextPage: false,
      executionTimeMs: 0,
      providerResults: [],
      products: []
    };
  }

  // Rich cache key includes all filter + sort + pagination + category dimensions
  const providerNames = selectedProviders.map(({ name }) => name).join(',');
  const cacheKey = cacheService.getCacheKey('search', JSON.stringify({
    query,
    platforms:    providerNames,
    category:     detectedCategory,
    sortBy:       options.sortBy       || '',
    brand:        options.brand        || '',
    minPrice:     options.minPrice     || '',
    maxPrice:     options.maxPrice     || '',
    minRating:    options.minRating    || '',
    availability: options.availability || '',
    page,
    limit
  }));
  const cachedPayload = await cacheService.get(cacheKey);

  if (cachedPayload) {
    const executionTimeMs = Date.now() - startedAt;
    const filtered = filterProducts(cachedPayload.products, options);
    const sorted   = sortProducts(filtered, options.sortBy);
    const startIdx = (page - 1) * limit;
    const products = sorted.slice(startIdx, startIdx + limit);

    analyticsService.recordSearch({
      query,
      executionTimeMs,
      cached: true,
      totalResults: sorted.length,
      providerResults: cachedPayload.providerResults,
      products
    });

    logger.info('Cache Hit – Search Served', { query, executionTimeMs });

    return {
      success: true,
      query,
      cached: true,
      detectedCategory,
      categoryLabel: getCategoryLabel(detectedCategory),
      page,
      limit,
      totalPlatforms: selectedProviders.length,
      totalResults: sorted.length,
      hasNextPage: startIdx + limit < sorted.length,
      executionTimeMs,
      providerResults: cachedPayload.providerResults,
      products
    };
  }

  logger.info('Search Started', { query, providers: providerNames });

  // Execute all providers concurrently – failures isolated by Promise.allSettled
  const settled = await Promise.allSettled(
    selectedProviders.map(({ name, instance, config }) =>
      executeProvider(name, instance, config, query)
    )
  );

  const providerResults = settled.map((outcome) => {
    if (outcome.status === 'fulfilled') {
      return outcome.value;
    }
    // This should never happen because executeProvider never throws,
    // but guard defensively anyway.
    logger.error('Unexpected Provider Settlement Failure', { reason: outcome.reason });
    return {
      platform: 'unknown',
      success: false,
      count: 0,
      products: [],
      error: String(outcome.reason)
    };
  });

  const consolidatedProducts = removeDuplicates(
    providerResults.flatMap(({ products }) => products)
  );

  // Persist to cache
  await cacheService.set(cacheKey, {
    providerResults: providerResults.map(({ platform, name, success, count, executionTimeMs, strategy, error }) => ({
      platform,
      name,
      success,
      count,
      executionTimeMs,
      strategy,
      error
    })),
    products: consolidatedProducts
  });

  const filtered  = filterProducts(consolidatedProducts, options);
  const sorted    = sortProducts(filtered, options.sortBy);
  const startIdx  = (page - 1) * limit;
  const products  = sorted.slice(startIdx, startIdx + limit);
  const executionTimeMs = Date.now() - startedAt;

  logger.info('Search Finished', {
    query,
    totalProducts: sorted.length,
    page,
    limit,
    executionTimeMs
  });

  const summaryResults = providerResults.map(
    ({ platform, name, success, count, executionTimeMs: pt, strategy, error }) => ({
      platform,
      name,
      success,
      count,
      executionTimeMs: pt,
      strategy,
      error
    })
  );

  analyticsService.recordSearch({
    query,
    executionTimeMs,
    cached: false,
    totalResults: sorted.length,
    providerResults: summaryResults,
    products
  });

  return {
    success: true,
    query,
    cached: false,
    detectedCategory,
    categoryLabel: getCategoryLabel(detectedCategory),
    page,
    limit,
    totalPlatforms: selectedProviders.length,
    totalResults: sorted.length,
    hasNextPage: startIdx + limit < sorted.length,
    executionTimeMs,
    providerResults: summaryResults,
    products
  };
}

/**
 * Search a single platform by name.
 *
 * @param {string} platform - Provider key
 * @param {string} query    - Search term
 * @param {object} options  - Filter / sort options
 * @returns {Promise<object>}
 */
async function searchPlatform(platform, query, options = {}) {
  return searchAllPlatforms(query, {
    ...options,
    platform: normalizePlatform(platform)
  });
}

module.exports = {
  searchAllPlatforms,
  searchPlatform,
  isSupportedPlatform,
  normalizePlatform,
  supportedPlatforms: SUPPORTED_PLATFORMS
};
