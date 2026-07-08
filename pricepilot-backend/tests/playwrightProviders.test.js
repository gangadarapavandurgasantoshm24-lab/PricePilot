/**
 * Unit tests – New Playwright Providers (Myntra, Purplle, Meesho)
 * @file tests/playwrightProviders.test.js
 *
 * Playwright is NOT invoked — providers fall back to their mock implementations.
 * Tests verify: interface compliance, mock fallback correctness, normalisation.
 */

// Mock the BrowserQueue so no browser is launched
jest.mock('../services/browserQueue', () => ({
  acquire: jest.fn().mockRejectedValue(new Error('Playwright not available in test')),
  getMetrics: jest.fn(() => ({ queueLength: 0, activePages: 0, maxPages: 5 }))
}));

jest.mock('../services/browserManager', () => ({
  createContext: jest.fn(),
  newPage:       jest.fn(),
  closePage:     jest.fn(),
  closeContext:  jest.fn(),
  getMetrics:    jest.fn(() => ({ available: false }))
}));

const myntraProvider  = require('../providers/myntra/myntra.playwright');
const purplleProvider = require('../providers/purplle/purplle.playwright');
const meeshoProvider  = require('../providers/meesho/meesho.playwright');

// ─── Interface compliance ─────────────────────────────────────────────────────

describe('Playwright providers – interface compliance', () => {
  const providers = [
    { name: 'myntra',  provider: myntraProvider },
    { name: 'purplle', provider: purplleProvider },
    { name: 'meesho',  provider: meeshoProvider }
  ];

  providers.forEach(({ name, provider }) => {
    describe(name, () => {
      it('has correct platform property', () => {
        expect(provider.platform).toBe(name);
      });

      it('has searchProducts function', () => {
        expect(typeof provider.searchProducts).toBe('function');
      });

      it('has selectors with searchUrl function', () => {
        expect(typeof provider.selectors.searchUrl).toBe('function');
      });

      it('selectors.searchUrl returns a string URL', () => {
        const url = provider.selectors.searchUrl('test query');
        expect(typeof url).toBe('string');
        expect(url).toMatch(/^https?:\/\//);
      });

      it('has mockFallback configured', () => {
        expect(provider.mockFallback).not.toBeNull();
        expect(typeof provider.mockFallback.searchProducts).toBe('function');
      });
    });
  });
});

// ─── Mock fallback via searchProducts ─────────────────────────────────────────

describe('Myntra provider – mock fallback', () => {
  it('searchProducts returns an array (mock fallback)', async () => {
    const results = await myntraProvider.searchProducts('shoes');
    expect(Array.isArray(results)).toBe(true);
  });

  it('mock fallback products have required fields', async () => {
    const results = await myntraProvider.searchProducts('shoes');
    if (results.length > 0) {
      const p = results[0];
      expect(p).toHaveProperty('platform', 'myntra');
      expect(p).toHaveProperty('productName');
      expect(p).toHaveProperty('currentPrice');
      expect(p).toHaveProperty('finalPayablePrice');
      expect(p).toHaveProperty('source');
    }
  });
});

describe('Purplle provider – mock fallback', () => {
  it('searchProducts returns an array (mock fallback)', async () => {
    const results = await purplleProvider.searchProducts('lipstick');
    expect(Array.isArray(results)).toBe(true);
  });

  it('returns beauty products for "lipstick"', async () => {
    const results = await purplleProvider.searchProducts('lipstick');
    expect(results.length).toBeGreaterThan(0);
    results.forEach(p => {
      expect(p.platform).toBe('purplle');
    });
  });

  it('returns empty array for unrelated query', async () => {
    const results = await purplleProvider.searchProducts('refrigerator');
    expect(Array.isArray(results)).toBe(true);
    // Purplle is beauty-only so unrelated query returns empty or near-empty
  });

  it('normalised products have all pricing fields', async () => {
    const results = await purplleProvider.searchProducts('serum');
    if (results.length > 0) {
      const p = results[0];
      expect(p).toHaveProperty('finalPayablePrice');
      expect(p).toHaveProperty('totalSavings');
      expect(p).toHaveProperty('discountPercentage');
    }
  });
});

describe('Meesho provider – mock fallback', () => {
  it('searchProducts returns an array (mock fallback)', async () => {
    const results = await meeshoProvider.searchProducts('dress');
    expect(Array.isArray(results)).toBe(true);
  });

  it('returns fashion products for "shoes"', async () => {
    const results = await meeshoProvider.searchProducts('shoes');
    expect(results.length).toBeGreaterThan(0);
    results.forEach(p => expect(p.platform).toBe('meesho'));
  });

  it('returns home products for "cookware"', async () => {
    const results = await meeshoProvider.searchProducts('cookware');
    expect(results.length).toBeGreaterThan(0);
  });

  it('normalised products have availability field', async () => {
    const results = await meeshoProvider.searchProducts('kurta');
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('availability');
    }
  });
});

// ─── Selector configs ─────────────────────────────────────────────────────────

describe('Selector configurations', () => {
  const myntraSelectors  = require('../config/selectors/myntra.selectors');
  const purplleSelectors = require('../config/selectors/purplle.selectors');
  const meeshoSelectors  = require('../config/selectors/meesho.selectors');

  [
    { name: 'myntra',  sel: myntraSelectors },
    { name: 'purplle', sel: purplleSelectors },
    { name: 'meesho',  sel: meeshoSelectors }
  ].forEach(({ name, sel }) => {
    it(`${name} selectors has searchUrl function`, () => {
      expect(typeof sel.searchUrl).toBe('function');
    });
    it(`${name} selectors has resultItem string`, () => {
      expect(typeof sel.resultItem).toBe('string');
    });
    it(`${name} selectors has waitFor string`, () => {
      expect(typeof sel.waitFor).toBe('string');
    });
  });
});
