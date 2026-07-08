/**
 * Unit tests – Provider Routing (Category-Aware)
 * @file tests/providerRouting.test.js
 *
 * Tests that the capability matrix maps categories to the right providers
 * and that detectCategory + getProvidersForCategory work together correctly.
 */

const { getProvidersForCategory, providerCapabilities } = require('../config/providerCapabilities');
const { detectCategory } = require('../services/categoryDetector');

// ─── Capability matrix structure ─────────────────────────────────────────────

describe('providerCapabilities structure', () => {
  it('has at least 12 providers configured', () => {
    expect(Object.keys(providerCapabilities).length).toBeGreaterThanOrEqual(12);
  });

  it('every provider has a categories array', () => {
    Object.entries(providerCapabilities).forEach(([name, cap]) => {
      expect(Array.isArray(cap.categories)).toBe(true);
      expect(cap.categories.length).toBeGreaterThan(0);
    });
  });

  it('every provider has a strategy string', () => {
    Object.values(providerCapabilities).forEach(cap => {
      expect(typeof cap.strategy).toBe('string');
    });
  });

  it('every provider has a priority number', () => {
    Object.values(providerCapabilities).forEach(cap => {
      expect(typeof cap.priority).toBe('number');
    });
  });

  it('purplle is configured for beauty', () => {
    expect(providerCapabilities.purplle.categories).toContain('beauty');
  });

  it('meesho is configured for fashion', () => {
    expect(providerCapabilities.meesho.categories).toContain('fashion');
  });

  it('myntra is configured for fashion', () => {
    expect(providerCapabilities.myntra.categories).toContain('fashion');
  });
});

// ─── getProvidersForCategory ──────────────────────────────────────────────────

describe('getProvidersForCategory', () => {
  it('returns amazon, flipkart, reliance, croma for electronics', () => {
    const providers = getProvidersForCategory('electronics');
    expect(providers).toContain('amazon');
    expect(providers).toContain('flipkart');
    expect(providers).toContain('reliancedigital');
    expect(providers).toContain('croma');
  });

  it('does NOT include nykaa or purplle for electronics', () => {
    const providers = getProvidersForCategory('electronics');
    expect(providers).not.toContain('nykaa');
    expect(providers).not.toContain('purplle');
  });

  it('returns myntra, ajio, meesho for fashion', () => {
    const providers = getProvidersForCategory('fashion');
    expect(providers).toContain('myntra');
    expect(providers).toContain('ajio');
    expect(providers).toContain('meesho');
  });

  it('does NOT include apollo or pharmeasy for fashion', () => {
    const providers = getProvidersForCategory('fashion');
    expect(providers).not.toContain('apollo');
    expect(providers).not.toContain('pharmeasy');
  });

  it('returns nykaa and purplle for beauty', () => {
    const providers = getProvidersForCategory('beauty');
    expect(providers).toContain('nykaa');
    expect(providers).toContain('purplle');
  });

  it('does NOT include flipkart or myntra for beauty', () => {
    const providers = getProvidersForCategory('beauty');
    expect(providers).not.toContain('flipkart');
    expect(providers).not.toContain('myntra');
  });

  it('returns apollo, pharmeasy, tata1mg for medicine', () => {
    const providers = getProvidersForCategory('medicine');
    expect(providers).toContain('apollo');
    expect(providers).toContain('pharmeasy');
    expect(providers).toContain('tata1mg');
  });

  it('returns all providers for general', () => {
    const providers = getProvidersForCategory('general');
    expect(providers.length).toBeGreaterThanOrEqual(12);
  });

  it('returns all providers for empty string', () => {
    const providers = getProvidersForCategory('');
    expect(providers.length).toBeGreaterThanOrEqual(12);
  });

  it('returns providers sorted by priority', () => {
    const providers = getProvidersForCategory('electronics');
    const amazonIdx = providers.indexOf('amazon');
    const cromaIdx  = providers.indexOf('croma');
    expect(amazonIdx).toBeLessThan(cromaIdx);
  });
});

// ─── End-to-end: query → category → providers ─────────────────────────────────

describe('End-to-end: query → category → providers', () => {
  it('"iPhone 16" routes to electronics providers only', () => {
    const cat = detectCategory('iPhone 16');
    expect(cat).toBe('electronics');
    const providers = getProvidersForCategory(cat);
    expect(providers).toContain('amazon');
    expect(providers).not.toContain('purplle');
  });

  it('"lipstick" routes to beauty providers only', () => {
    const cat = detectCategory('lipstick');
    expect(cat).toBe('beauty');
    const providers = getProvidersForCategory(cat);
    expect(providers).toContain('nykaa');
    expect(providers).toContain('purplle');
    expect(providers).not.toContain('croma');
  });

  it('"running shoes" routes to fashion providers', () => {
    const cat = detectCategory('running shoes');
    expect(cat).toBe('fashion');
    const providers = getProvidersForCategory(cat);
    expect(providers).toContain('myntra');
    expect(providers).toContain('meesho');
  });

  it('"paracetamol" routes to medicine providers only', () => {
    const cat = detectCategory('paracetamol');
    expect(cat).toBe('medicine');
    const providers = getProvidersForCategory(cat);
    expect(providers).toContain('apollo');
    expect(providers).not.toContain('myntra');
  });
});
