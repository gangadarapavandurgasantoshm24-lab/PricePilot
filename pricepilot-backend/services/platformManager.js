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
const { groupProducts } = require('./productGrouping.service');
const { parseSearchIntent } = require('./searchIntent.service');
const { applySearchRelevance } = require('./searchRelevance.service');
const { filterValidProducts, validateProductsWithDetails } = require('../utils/productValidator');
const { detectCategory, detectCategoryDetails, getCategoryLabel } = require('./categoryDetector');
const { getProvidersForCategory } = require('../config/providerCapabilities');
const { booleanEnv } = require('../config/env');
const logger             = require('../utils/logger');
const { SUPPORTED_PLATFORMS } = require('../config/constants');

// Amazon is the true universal provider — it covers all categories.
// Flipkart is NOT universal: it doesn't specialise in groceries/medicine/beauty.
// Provider routing is now fully delegated to config/providerCapabilities.js.
const UNIVERSAL_PROVIDER_NAMES = ['amazon'];
const ENABLE_MOCK_FALLBACK = booleanEnv('ENABLE_MOCK_FALLBACK', process.env.NODE_ENV === 'test');

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

function productKey(product) {
  return [
    product.productId,
    product.productUrl,
    product.platform,
    product.productName
  ].filter(Boolean).join('|');
}

function buildPipelineTrace({ providerResults, scoredProducts, groupedProducts, returnedProducts, providerDiagnostics }) {
  const scoreByKey = new Map(scoredProducts.map((product) => [productKey(product), product]));
  const returnedKeys = new Set(returnedProducts.map(productKey));
  const groupByStoreKey = new Map();

  groupedProducts.forEach((group) => {
    (group.stores || []).forEach((store) => {
      groupByStoreKey.set(productKey(store), {
        productKey: group.productKey,
        productName: group.productName,
        stores: (group.stores || []).map((item) => item.platform)
      });
      if (store.productUrl) {
        groupByStoreKey.set(store.productUrl, {
          productKey: group.productKey,
          productName: group.productName,
          stores: (group.stores || []).map((item) => item.platform)
        });
      }
    });
  });

  const diagnosticsByProvider = new Map(
    providerDiagnostics.map((diagnostic) => [diagnostic.provider || diagnostic.platform, diagnostic])
  );

  return providerResults.map(({ name, platform, success, count, error, products }) => {
    const providerName = name || platform;
    const diagnostic = diagnosticsByProvider.get(providerName) || diagnosticsByProvider.get(platform) || {};
    return {
      provider: providerName,
      platform,
      success,
      error,
      counts: {
        extracted: diagnostic.productsExtracted || count || 0,
        normalized: diagnostic.productsNormalized || count || 0,
        validated: diagnostic.productsValidated || count || 0,
        validationRejected: diagnostic.validationRejected || 0,
        grouped: 0,
        returned: 0
      },
      products: (products || []).slice(0, 12).map((product) => {
        const scored = scoreByKey.get(productKey(product));
        const group = groupByStoreKey.get(productKey(product)) || groupByStoreKey.get(product.productUrl);
        const returned = returnedKeys.has(productKey(product));
        return {
          productId: product.productId,
          productName: product.productName,
          brand: product.brand,
          platform: product.platform,
          productUrl: product.productUrl,
          extracted: true,
          normalized: true,
          validated: true,
          relevanceScore: scored ? scored.relevanceScore : null,
          relevanceReasons: scored ? scored.relevanceReasons : [],
          grouped: Boolean(group),
          groupProductName: group ? group.productName : null,
          groupStores: group ? group.stores : [],
          returned
        };
      })
    };
  }).map((trace) => {
    trace.counts.grouped = trace.products.filter((product) => product.grouped).length;
    trace.counts.returned = trace.products.filter((product) => product.returned).length;
    return trace;
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
      const validation = validateProductsWithDetails(rawProducts);
      const validProducts = validation.validProducts;
      const executionTimeMs = Date.now() - startedAt;
      const diagnostics = {
        ...(instance.lastDiagnostics || {}),
        provider: name,
        platform: instance.platform,
        productsExtracted: rawProducts.length,
        productsNormalized: rawProducts.length,
        productsValidated: validProducts.length,
        validationRejected: validation.rejectedCount,
        validationRejectionReasons: validation.rejectionReasons,
        returned: validProducts.length,
        elapsedTimeMs: executionTimeMs,
        status: 'success'
      };

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
        diagnostics,
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

  if (ENABLE_MOCK_FALLBACK && instance.mockFallback && typeof instance.mockFallback.searchProducts === 'function') {
    try {
      logger.info('Provider Falling Back To Mock', {
        platform: instance.platform,
        reason: lastError.message
      });

      const fallbackProducts = await instance.mockFallback.searchProducts(query);
      const validProducts = filterValidProducts(
        fallbackProducts.map((product) => ({
          ...product,
          source: 'mock-fallback'
        }))
      );

      providerRegistry.recordSuccess(name, executionTimeMs);
      const diagnostics = {
        ...(instance.lastDiagnostics || {}),
        provider: name,
        platform: instance.platform,
        search: query,
        productsValidated: validProducts.length,
        returned: validProducts.length,
        elapsedTimeMs: executionTimeMs,
        status: 'mock-fallback',
        errors: [lastError.message]
      };

      return {
        platform: instance.platform,
        name,
        success: true,
        count: validProducts.length,
        executionTimeMs,
        strategy: 'mock-fallback',
        diagnostics,
        products: validProducts
      };
    } catch (fallbackError) {
      logger.warn('Provider Mock Fallback Failed', {
        platform: instance.platform,
        message: fallbackError.message
      });
    }
  }

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
    diagnostics: {
      ...(instance.lastDiagnostics || {}),
      provider: name,
      platform: instance.platform,
      search: query,
      returned: 0,
      elapsedTimeMs: executionTimeMs,
      status: 'failed',
      errors: [lastError.message]
    },
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
  const searchIntent = parseSearchIntent(query);
  const providerQuery = searchIntent.correctedQuery || query;

  // Destructure pagination options
  const page  = Math.max(1, Number(options.page)  || 1);
  const limit = Math.max(1, Number(options.limit) || 20);

  // ── Category detection & routing ─────────────────────────────────────────
  // If the caller supplied an explicit category, use it.
  // Otherwise detect category from the query text.
  const categoryDetails = options.category
    ? { category: String(options.category).trim().toLowerCase(), subtype: '', confidence: 1, matchedSignals: [] }
    : {
        category: searchIntent.category || detectCategoryDetails(providerQuery).category,
        subtype: searchIntent.productType || '',
        confidence: searchIntent.categoryConfidence || 0,
        matchedSignals: []
      };
  const detectedCategory = categoryDetails.category || detectCategory(providerQuery);

  // Select providers
  const allEnabled = providerRegistry.getEnabledProviders();

  // Priority filter chain:
  //   1. If options.platform is set → that single platform only
  //   2. If category resolved with sufficient confidence → category-specific providers
  //      Amazon is always included as a universal provider across all categories.
  //   3. Low confidence or 'general' → all enabled providers
  let selectedProviders;
  if (options.platform) {
    selectedProviders = allEnabled.filter(
      ({ name }) => name === normalizePlatform(options.platform)
    );
  } else if (detectedCategory && detectedCategory !== 'general' && categoryDetails.confidence >= 0.35) {
    // Category routing: use providerCapabilities.js (the single source of truth)
    const capableNames  = getProvidersForCategory(detectedCategory);
    // Amazon is always added as a universal provider
    const selectedNames = new Set([...UNIVERSAL_PROVIDER_NAMES, ...capableNames]);
    selectedProviders   = allEnabled.filter(({ name }) => selectedNames.has(name));
    // Fall back to all providers if capability matrix yields nothing registered
    if (selectedProviders.length === 0) selectedProviders = allEnabled;
  } else {
    // Low confidence or general: search all enabled providers
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
      totalGroups: 0,
      hasNextPage: false,
      executionTimeMs: 0,
      providerResults: [],
      providerDiagnostics: [],
      products: [],
      groupedProducts: []
    };
  }

  // Rich cache key includes all filter + sort + pagination + category dimensions
  const providerNames = selectedProviders.map(({ name }) => name).join(',');
  const cacheKey = cacheService.getCacheKey('search', JSON.stringify({
    query,
    providerQuery,
    intent: searchIntent,
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
    const relevance = applySearchRelevance(cachedPayload.products, searchIntent);
    const filtered = filterProducts(relevance.mainProducts, options);
    const sorted   = sortProducts(filtered, options.sortBy);
    const startIdx = (page - 1) * limit;
    const allGroupedProducts = groupProducts(sorted);
    const groupedProducts = allGroupedProducts.slice(startIdx, startIdx + limit);
    const groupedStoreUrls = new Set(
      groupedProducts.flatMap((group) =>
        (group.stores || []).map((store) => store.productUrl).filter(Boolean)
      )
    );
    const products = sorted.filter((product) =>
      groupedStoreUrls.has(product.productUrl)
    ).slice(0, limit * Math.max(1, groupedProducts.length || 1));
    const relatedProducts = relevance.relatedProducts.slice(0, limit);
    const groupedRelatedProducts = groupProducts(relatedProducts);
    const cachedProviderResultsWithProducts = (cachedPayload.providerResults || []).map((result) => ({
      ...result,
      products: cachedPayload.products.filter((product) => product.platform === result.platform || product.platform === result.name)
    }));
    const pipelineTrace = buildPipelineTrace({
      providerResults: cachedProviderResultsWithProducts,
      scoredProducts: relevance.scoredProducts,
      groupedProducts: allGroupedProducts,
      returnedProducts: products,
      providerDiagnostics: cachedPayload.providerDiagnostics || []
    });

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
      categoryDetails,
      searchIntent,
      correctedQuery: searchIntent.corrected ? providerQuery : undefined,
      page,
      limit,
      totalPlatforms: selectedProviders.length,
      totalResults: sorted.length,
      totalGroups: allGroupedProducts.length,
      hasNextPage: startIdx + limit < allGroupedProducts.length,
      executionTimeMs,
      providerResults: cachedPayload.providerResults,
      providerDiagnostics: cachedPayload.providerDiagnostics || [],
      pipelineTrace,
      products,
      groupedProducts,
      relatedProducts,
      groupedRelatedProducts
    };
  }

  logger.info('Search Started', { query, providerQuery, providers: providerNames, intent: searchIntent });

  // Execute all providers concurrently – failures isolated by Promise.allSettled
  const settled = await Promise.allSettled(
    selectedProviders.map(({ name, instance, config }) =>
      executeProvider(name, instance, config, providerQuery)
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
    providerDiagnostics: providerResults.map(({ diagnostics }) => diagnostics).filter(Boolean),
    products: consolidatedProducts
  });

  const relevance = applySearchRelevance(consolidatedProducts, searchIntent);
  const filtered  = filterProducts(relevance.mainProducts, options);
  const sorted    = sortProducts(filtered, options.sortBy);
  const allGroupedProducts = groupProducts(sorted);
  const startIdx  = (page - 1) * limit;
  const groupedProducts = allGroupedProducts.slice(startIdx, startIdx + limit);
  const groupedStoreUrls = new Set(
    groupedProducts.flatMap((group) =>
      (group.stores || []).map((store) => store.productUrl).filter(Boolean)
    )
  );
  const products  = sorted.filter((product) => groupedStoreUrls.has(product.productUrl));
  const relatedProducts = relevance.relatedProducts.slice(0, limit);
  const groupedRelatedProducts = groupProducts(relatedProducts);
  const executionTimeMs = Date.now() - startedAt;

  logger.info('Search Finished', {
    query,
    totalProducts: sorted.length,
    totalGroups: allGroupedProducts.length,
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
  const providerDiagnostics = providerResults.map(({ diagnostics }) => diagnostics).filter(Boolean);
  const pipelineTrace = buildPipelineTrace({
    providerResults,
    scoredProducts: relevance.scoredProducts,
    groupedProducts: allGroupedProducts,
    returnedProducts: products,
    providerDiagnostics
  });

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
    categoryDetails,
    searchIntent,
    searchMode: searchIntent.searchMode || 'generic',
    correctedQuery: searchIntent.corrected ? providerQuery : undefined,
    page,
    limit,
    totalPlatforms: selectedProviders.length,
    totalResults: sorted.length,
    totalGroups: allGroupedProducts.length,
    hasNextPage: startIdx + limit < allGroupedProducts.length,
    executionTimeMs,
    providerResults: summaryResults,
    providerDiagnostics,
    pipelineTrace,
    products,
    groupedProducts,
    relatedProducts,
    groupedRelatedProducts
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
