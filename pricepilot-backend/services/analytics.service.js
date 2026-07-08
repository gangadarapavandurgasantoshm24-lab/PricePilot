/**
 * @module analyticsService
 * @description Tracks search-level metrics and provider-level success/failure rates.
 *
 * All data is kept in memory. In Week 5, this can be swapped for a persistent
 * store (Redis, MongoDB, SQLite) without touching controllers or routes.
 *
 * Tracked metrics
 *  - Total searches
 *  - Average response time
 *  - Cache hit / miss rate
 *  - Provider success / failure counts
 *  - Most searched terms
 *  - Most searched brands
 */

const { numberEnv } = require('../config/env');

const MAX_HISTORY = numberEnv('ANALYTICS_MAX_HISTORY', 200);

/** @type {Array<object>} */
const searchHistory = [];

const counters = {
  totalSearches: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalResponseTimeMs: 0
};

/** @type {Map<string, number>} term → count */
const termCounts = new Map();

/** @type {Map<string, number>} brand → count */
const brandCounts = new Map();

/** @type {Map<string, {success: number, failure: number}>} */
const providerStats = new Map();

// ─── Internal helpers ───────────────────────────────────────────────────────

function increment(map, key, by = 1) {
  map.set(key, (map.get(key) || 0) + by);
}

function topN(map, n = 10) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term, count]) => ({ term, count }));
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Record a completed search.
 *
 * @param {object} params
 * @param {string} params.query          - Search term
 * @param {number} params.executionTimeMs - Wall-clock duration
 * @param {boolean} params.cached         - Whether the result was served from cache
 * @param {number} params.totalResults    - How many products were returned
 * @param {Array<object>} params.providerResults - Per-provider outcome array
 * @param {Array<object>} params.products - Returned products (used for brand tracking)
 */
function recordSearch({ query, executionTimeMs, cached, totalResults, providerResults = [], products = [] }) {
  counters.totalSearches += 1;
  counters.totalResponseTimeMs += executionTimeMs;

  if (cached) {
    counters.cacheHits += 1;
  } else {
    counters.cacheMisses += 1;
  }

  // Term frequency
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (normalizedQuery) increment(termCounts, normalizedQuery);

  // Brand frequency from returned products
  products.forEach((product) => {
    const brand = String(product.brand || '').trim().toLowerCase();
    if (brand) increment(brandCounts, brand);
  });

  // Per-provider stats
  providerResults.forEach(({ platform, success }) => {
    if (!providerStats.has(platform)) {
      providerStats.set(platform, { success: 0, failure: 0 });
    }
    const stats = providerStats.get(platform);
    if (success) {
      stats.success += 1;
    } else {
      stats.failure += 1;
    }
  });

  // Append to history ring buffer
  const entry = {
    query: normalizedQuery,
    timestamp: new Date().toISOString(),
    totalResults,
    executionTimeMs,
    cached
  };

  searchHistory.push(entry);
  if (searchHistory.length > MAX_HISTORY) {
    searchHistory.shift();
  }
}

/**
 * Return the full analytics summary.
 *
 * @returns {object}
 */
function getSummary() {
  const { totalSearches, cacheHits, cacheMisses, totalResponseTimeMs } = counters;
  const totalCacheChecks = cacheHits + cacheMisses;

  const providerSummary = [...providerStats.entries()].map(([platform, stats]) => {
    const total = stats.success + stats.failure;
    return {
      platform,
      successfulRequests: stats.success,
      failedRequests: stats.failure,
      totalRequests: total,
      successRate: total > 0 ? `${((stats.success / total) * 100).toFixed(1)}%` : 'N/A'
    };
  });

  return {
    totalSearches,
    averageResponseTimeMs: totalSearches > 0 ? Math.round(totalResponseTimeMs / totalSearches) : 0,
    cacheHits,
    cacheMisses,
    cacheHitRate: totalCacheChecks > 0 ? `${((cacheHits / totalCacheChecks) * 100).toFixed(1)}%` : 'N/A',
    cacheMissRate: totalCacheChecks > 0 ? `${((cacheMisses / totalCacheChecks) * 100).toFixed(1)}%` : 'N/A',
    providerStats: providerSummary,
    mostSearchedTerms: topN(termCounts, 10),
    mostSearchedBrands: topN(brandCounts, 10)
  };
}

/**
 * Return search history entries (most-recent first).
 *
 * @param {number} limit - Max entries to return (default 50)
 * @returns {Array<object>}
 */
function getHistory(limit = 50) {
  return [...searchHistory].reverse().slice(0, limit);
}

/**
 * Reset all counters (used in tests).
 */
function reset() {
  counters.totalSearches = 0;
  counters.cacheHits = 0;
  counters.cacheMisses = 0;
  counters.totalResponseTimeMs = 0;
  termCounts.clear();
  brandCounts.clear();
  providerStats.clear();
  searchHistory.length = 0;
}

module.exports = {
  recordSearch,
  getSummary,
  getHistory,
  reset
};
