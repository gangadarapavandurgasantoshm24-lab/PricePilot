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

  it('includes all 10 configured platforms', () => {
    const expected = [
      'amazon', 'flipkart', 'nykaa', 'apollo', 'pharmeasy',
      'tata1mg', 'myntra', 'ajio', 'reliancedigital', 'croma'
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

// ─── createProvider – mock strategy ──────────────────────────────────────────

describe('providerFactory.createProvider (mock strategy)', () => {
  it('returns a valid mock provider for flipkart', () => {
    const provider = providerFactory.createProvider('flipkart');
    expect(provider).toBeDefined();
    expect(provider.platform).toBe('flipkart');
    expect(typeof provider.searchProducts).toBe('function');
  });

  it('returns a valid mock provider for myntra', () => {
    const provider = providerFactory.createProvider('myntra');
    expect(provider.platform).toBe('myntra');
  });

  it('mock provider searchProducts returns an array', async () => {
    const provider = providerFactory.createProvider('flipkart');
    const results  = await provider.searchProducts('shoes');
    expect(Array.isArray(results)).toBe(true);
  });
});

// ─── createProvider – official-api strategy (amazon) ─────────────────────────

describe('providerFactory.createProvider (official-api strategy – amazon)', () => {
  it('returns a provider with platform = amazon', () => {
    const provider = providerFactory.createProvider('amazon');
    expect(provider).toBeDefined();
    expect(provider.platform).toBe('amazon');
    expect(typeof provider.searchProducts).toBe('function');
  });

  it('amazon provider returns an array from searchProducts (mock fallback if no creds)', async () => {
    const provider = providerFactory.createProvider('amazon');
    const results  = await provider.searchProducts('laptop');
    expect(Array.isArray(results)).toBe(true);
  });

  it('amazon._activeStrategy is defined', () => {
    const provider = providerFactory.createProvider('amazon');
    // _activeStrategy is 'official-api' if creds configured, 'mock-fallback' otherwise
    expect(['official-api', 'mock-fallback']).toContain(provider._activeStrategy);
  });
});

// ─── createProvider – unknown platform ───────────────────────────────────────

describe('providerFactory.createProvider (error paths)', () => {
  it('throws for a platform with no configuration', () => {
    expect(() => providerFactory.createProvider('nonexistent')).toThrow();
  });
});
