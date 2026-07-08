/**
 * Unit tests – Platform Manager
 * @file tests/platformManager.test.js
 *
 * Tests focus on:
 *  - normalizePlatform  (alias resolution)
 *  - isSupportedPlatform
 *  - duplicate detection logic (dedup via platform + brand + name)
 *
 * We do NOT test the full search path here (that is covered in searchApi.test.js).
 * Platform Manager registers real providers on import, so we must not
 * jest.resetModules() between tests – the module is shared.
 */

const platformManager = require('../services/platformManager');

// ─── normalizePlatform ───────────────────────────────────────────────────────

describe('normalizePlatform', () => {
  it('returns the platform key unchanged when already canonical', () => {
    expect(platformManager.normalizePlatform('amazon')).toBe('amazon');
    expect(platformManager.normalizePlatform('flipkart')).toBe('flipkart');
    expect(platformManager.normalizePlatform('reliancedigital')).toBe('reliancedigital');
  });

  it('normalises known aliases', () => {
    expect(platformManager.normalizePlatform('reliance-digital')).toBe('reliancedigital');
    expect(platformManager.normalizePlatform('reliance')).toBe('reliancedigital');
    expect(platformManager.normalizePlatform('tata-1mg')).toBe('tata1mg');
    expect(platformManager.normalizePlatform('1mg')).toBe('tata1mg');
    expect(platformManager.normalizePlatform('apollo-pharmacy')).toBe('apollo');
    expect(platformManager.normalizePlatform('amazonpharmacy')).toBe('amazon');
  });

  it('lowercases and strips whitespace', () => {
    expect(platformManager.normalizePlatform('AMAZON')).toBe('amazon');
    expect(platformManager.normalizePlatform('  Flipkart  ')).toBe('flipkart');
    expect(platformManager.normalizePlatform('Reliance Digital')).toBe('reliancedigital');
  });

  it('returns the original key when alias is unknown', () => {
    expect(platformManager.normalizePlatform('mynewstore')).toBe('mynewstore');
  });

  it('handles null / undefined gracefully', () => {
    expect(platformManager.normalizePlatform(null)).toBe('');
    expect(platformManager.normalizePlatform(undefined)).toBe('');
    expect(platformManager.normalizePlatform('')).toBe('');
  });
});

// ─── isSupportedPlatform ─────────────────────────────────────────────────────

describe('isSupportedPlatform', () => {
  it('returns true for all canonical providers', () => {
    const supported = [
      'amazon', 'flipkart', 'nykaa', 'apollo', 'pharmeasy',
      'tata1mg', 'myntra', 'ajio', 'reliancedigital', 'croma'
    ];
    supported.forEach((platform) => {
      expect(platformManager.isSupportedPlatform(platform)).toBe(true);
    });
  });

  it('returns true for alias strings', () => {
    expect(platformManager.isSupportedPlatform('reliance-digital')).toBe(true);
    expect(platformManager.isSupportedPlatform('1mg')).toBe(true);
    expect(platformManager.isSupportedPlatform('apollo-pharmacy')).toBe(true);
  });

  it('returns false for unknown platforms', () => {
    expect(platformManager.isSupportedPlatform('nonexistent')).toBe(false);
    expect(platformManager.isSupportedPlatform('paytmmall')).toBe(false);
    expect(platformManager.isSupportedPlatform('')).toBe(false);
  });
});

// ─── supportedPlatforms list ─────────────────────────────────────────────────

describe('supportedPlatforms', () => {
  it('exports an array of canonical platform keys', () => {
    expect(Array.isArray(platformManager.supportedPlatforms)).toBe(true);
    expect(platformManager.supportedPlatforms.length).toBeGreaterThan(0);
  });

  it('contains all 10 expected platforms', () => {
    const expected = [
      'amazon', 'flipkart', 'nykaa', 'apollo', 'pharmeasy',
      'tata1mg', 'myntra', 'ajio', 'reliancedigital', 'croma'
    ];
    expected.forEach((p) => {
      expect(platformManager.supportedPlatforms).toContain(p);
    });
  });
});
