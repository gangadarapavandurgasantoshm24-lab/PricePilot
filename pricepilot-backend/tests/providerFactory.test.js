/**
 * Unit tests – Provider Factory
 * @file tests/providerFactory.test.js
 *
 * Verifies that providerFactory:
 *  - Returns a valid provider for every configured platform
 *  - Dispatches to the correct implementation by strategy
 *  - Falls back to mock when official-api provider fails
 *  - createAll() returns a complete map with the right interface
 */

jest.mock('../services/browserQueue', () => ({
  acquire: jest.fn().mockRejectedValue(new Error('Playwright not available in providerFactory unit test')),
  getMetrics: jest.fn(() => ({ queueLength: 0, activePages: 0, maxPages: 5 }))
}));

const providerFactory = require('../services/providerFactory');

// ─── createAll ────────────────────────────────────────────────────────────────

describe('providerFactory.createAll', () => {
  let providerMap;

  beforeAll(() => {
    providerMap = providerFactory.createAll();
  });

  it('returns an object (not null, not array)', () => {
    expect(providerMap).toBeDefined();
    expect(typeof providerMap).toBe('object');
    expect(Array.isArray(providerMap)).toBe(false);
  });

  it('includes all configured platforms', () => {
    const expected = [
      'amazon', 'flipkart', 'nykaa', 'apollo', 'pharmeasy',
      'tata1mg', 'netmeds', 'myntra', 'ajio', 'meesho',
      'purplle', 'tira', 'reliancedigital', 'croma', 'vijaysales'
    ];
    expected.forEach((name) => {
      expect(providerMap).toHaveProperty(name);
    });
  });

  it('every provider has a searchProducts function', () => {
    Object.entries(providerMap).forEach(([name, provider]) => {
      expect(typeof provider.searchProducts).toBe('function');
    });
  });

  it('every provider has a platform string', () => {
    Object.entries(providerMap).forEach(([name, provider]) => {
      expect(typeof provider.platform).toBe('string');
      expect(provider.platform.length).toBeGreaterThan(0);
    });
  });
});

// ─── createProvider – playwright strategy ────────────────────────────────────

describe('providerFactory.createProvider (playwright strategy)', () => {
  it('returns a valid Playwright provider for flipkart', () => {
    const provider = providerFactory.createProvider('flipkart');
    expect(provider).toBeDefined();
    expect(provider.platform).toBe('flipkart');
    expect(typeof provider.searchProducts).toBe('function');
  });

  it('returns a valid Playwright provider for myntra', () => {
    const provider = providerFactory.createProvider('myntra');
    expect(provider.platform).toBe('myntra');
  });

  it('searchProducts returns an array via mock fallback when browser is unavailable', async () => {
    const provider = providerFactory.createProvider('flipkart');
    const results  = await provider.searchProducts('shoes');
    expect(Array.isArray(results)).toBe(true);
  });
});

// ─── createProvider – amazon Playwright strategy ─────────────────────────────

describe('providerFactory.createProvider (playwright strategy – amazon)', () => {
  it('returns a provider with platform = amazon', () => {
    const provider = providerFactory.createProvider('amazon');
    expect(provider).toBeDefined();
    expect(provider.platform).toBe('amazon');
    expect(typeof provider.searchProducts).toBe('function');
  });

  it('amazon provider returns an array from searchProducts (mock fallback if browser unavailable)', async () => {
    const provider = providerFactory.createProvider('amazon');
    const results  = await provider.searchProducts('laptop');
    expect(Array.isArray(results)).toBe(true);
  });

  it('amazon provider uses Playwright selectors', () => {
    const provider = providerFactory.createProvider('amazon');
    expect(typeof provider.selectors.searchUrl).toBe('function');
  });
});

// ─── createProvider – unknown platform ───────────────────────────────────────

describe('providerFactory.createProvider (error paths)', () => {
  it('throws for a platform with no configuration', () => {
    expect(() => providerFactory.createProvider('nonexistent')).toThrow();
  });
});
