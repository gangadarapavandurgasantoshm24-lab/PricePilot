/**
 * Unit tests – Analytics Service
 * @file tests/analyticsService.test.js
 */

const analyticsService = require('../services/analytics.service');

beforeEach(() => {
  analyticsService.reset();
});

const providerResults = [
  { platform: 'amazon', success: true },
  { platform: 'flipkart', success: false }
];

const sampleProducts = [
  { brand: 'Apple', finalPayablePrice: 50000 },
  { brand: 'Samsung', finalPayablePrice: 30000 }
];

describe('recordSearch', () => {
  it('increments totalSearches', () => {
    analyticsService.recordSearch({ query: 'iphone', executionTimeMs: 300, cached: false, totalResults: 5, providerResults, products: sampleProducts });
    const summary = analyticsService.getSummary();
    expect(summary.totalSearches).toBe(1);
  });

  it('tracks cache hits and misses separately', () => {
    analyticsService.recordSearch({ query: 'iphone', executionTimeMs: 300, cached: false, totalResults: 5, providerResults, products: [] });
    analyticsService.recordSearch({ query: 'iphone', executionTimeMs: 10, cached: true, totalResults: 5, providerResults, products: [] });
    const summary = analyticsService.getSummary();
    expect(summary.cacheHits).toBe(1);
    expect(summary.cacheMisses).toBe(1);
  });

  it('calculates average response time correctly', () => {
    analyticsService.recordSearch({ query: 'a', executionTimeMs: 100, cached: false, totalResults: 1, providerResults: [], products: [] });
    analyticsService.recordSearch({ query: 'b', executionTimeMs: 300, cached: false, totalResults: 1, providerResults: [], products: [] });
    const summary = analyticsService.getSummary();
    expect(summary.averageResponseTimeMs).toBe(200);
  });

  it('tracks most searched terms', () => {
    analyticsService.recordSearch({ query: 'iphone', executionTimeMs: 100, cached: false, totalResults: 1, providerResults: [], products: [] });
    analyticsService.recordSearch({ query: 'iphone', executionTimeMs: 100, cached: false, totalResults: 1, providerResults: [], products: [] });
    analyticsService.recordSearch({ query: 'laptop', executionTimeMs: 100, cached: false, totalResults: 1, providerResults: [], products: [] });
    const summary = analyticsService.getSummary();
    expect(summary.mostSearchedTerms[0].term).toBe('iphone');
    expect(summary.mostSearchedTerms[0].count).toBe(2);
  });

  it('tracks most searched brands from returned products', () => {
    analyticsService.recordSearch({
      query: 'test',
      executionTimeMs: 100,
      cached: false,
      totalResults: 2,
      providerResults: [],
      products: [{ brand: 'Apple' }, { brand: 'Apple' }, { brand: 'Samsung' }]
    });
    const summary = analyticsService.getSummary();
    expect(summary.mostSearchedBrands[0].term).toBe('apple');
    expect(summary.mostSearchedBrands[0].count).toBe(2);
  });

  it('tracks provider success and failure rates', () => {
    analyticsService.recordSearch({ query: 'test', executionTimeMs: 100, cached: false, totalResults: 1, providerResults, products: [] });
    const summary = analyticsService.getSummary();
    const amazon = summary.providerStats.find((p) => p.platform === 'amazon');
    const flipkart = summary.providerStats.find((p) => p.platform === 'flipkart');
    expect(amazon.successfulRequests).toBe(1);
    expect(flipkart.failedRequests).toBe(1);
  });
});

describe('getHistory', () => {
  it('returns history in reverse chronological order', () => {
    analyticsService.recordSearch({ query: 'first', executionTimeMs: 100, cached: false, totalResults: 1, providerResults: [], products: [] });
    analyticsService.recordSearch({ query: 'second', executionTimeMs: 100, cached: false, totalResults: 1, providerResults: [], products: [] });
    const history = analyticsService.getHistory();
    expect(history[0].query).toBe('second');
    expect(history[1].query).toBe('first');
  });

  it('respects the limit parameter', () => {
    for (let i = 0; i < 10; i += 1) {
      analyticsService.recordSearch({ query: `query${i}`, executionTimeMs: 50, cached: false, totalResults: 0, providerResults: [], products: [] });
    }
    const history = analyticsService.getHistory(3);
    expect(history).toHaveLength(3);
  });
});

describe('reset', () => {
  it('clears all accumulated data', () => {
    analyticsService.recordSearch({ query: 'test', executionTimeMs: 100, cached: false, totalResults: 1, providerResults, products: [] });
    analyticsService.reset();
    const summary = analyticsService.getSummary();
    expect(summary.totalSearches).toBe(0);
    expect(analyticsService.getHistory()).toHaveLength(0);
  });
});
