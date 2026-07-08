/**
 * Unit tests – Category Detector
 * @file tests/categoryDetector.test.js
 */

const { detectCategory, getCategoryLabel, CATEGORY_KEYWORDS } = require('../services/categoryDetector');

describe('detectCategory – electronics', () => {
  it('detects "iPhone 16" as electronics', () => expect(detectCategory('iPhone 16')).toBe('electronics'));
  it('detects "laptop" as electronics', () => expect(detectCategory('laptop')).toBe('electronics'));
  it('detects "bluetooth earbuds" as electronics', () => expect(detectCategory('bluetooth earbuds')).toBe('electronics'));
  it('detects "Samsung 4K TV" as electronics', () => expect(detectCategory('Samsung 4K TV')).toBe('electronics'));
  it('detects "power bank" as electronics', () => expect(detectCategory('power bank')).toBe('electronics'));
});

describe('detectCategory – fashion', () => {
  it('detects "red running shoes" as fashion', () => expect(detectCategory('red running shoes')).toBe('fashion'));
  it('detects "women summer dress" as fashion', () => expect(detectCategory('women summer dress')).toBe('fashion'));
  it('detects "denim jeans" as fashion', () => expect(detectCategory('denim jeans')).toBe('fashion'));
  it('detects "kurta for women" as fashion', () => expect(detectCategory('kurta for women')).toBe('fashion'));
  it('detects "leather handbag" as fashion', () => expect(detectCategory('leather handbag')).toBe('fashion'));
});

describe('detectCategory – beauty', () => {
  it('detects "lipstick" as beauty', () => expect(detectCategory('lipstick')).toBe('beauty'));
  it('detects "face wash" as beauty', () => expect(detectCategory('face wash')).toBe('beauty'));
  it('detects "vitamin c serum" as beauty', () => expect(detectCategory('vitamin c serum')).toBe('beauty'));
  it('detects "hair shampoo" as beauty', () => expect(detectCategory('hair shampoo')).toBe('beauty'));
  it('detects "foundation makeup" as beauty', () => expect(detectCategory('foundation makeup')).toBe('beauty'));
});

describe('detectCategory – medicine', () => {
  it('detects "paracetamol" as medicine', () => expect(detectCategory('paracetamol')).toBe('medicine'));
  it('detects "vitamin tablet" as medicine', () => expect(detectCategory('vitamin tablet')).toBe('medicine'));
  it('detects "blood pressure monitor" as medicine', () => expect(detectCategory('blood pressure monitor')).toBe('medicine'));
  it('detects "pulse oximeter" as medicine', () => expect(detectCategory('pulse oximeter')).toBe('medicine'));
});

describe('detectCategory – home', () => {
  it('detects "pressure cooker" as home', () => expect(detectCategory('pressure cooker')).toBe('home'));
  it('detects "sofa set" as home', () => expect(detectCategory('sofa set')).toBe('home'));
  it('detects "bed mattress" as home', () => expect(detectCategory('bed mattress')).toBe('home'));
});

describe('detectCategory – general / edge cases', () => {
  it('returns general for unknown query', () => expect(detectCategory('xyzabc12345')).toBe('general'));
  it('returns general for empty string', () => expect(detectCategory('')).toBe('general'));
  it('returns general for null', () => expect(detectCategory(null)).toBe('general'));
  it('is case-insensitive', () => expect(detectCategory('LIPSTICK')).toBe('beauty'));
  it('handles mixed case', () => expect(detectCategory('Running SHOES')).toBe('fashion'));
});

describe('getCategoryLabel', () => {
  it('returns emoji label for electronics', () => expect(getCategoryLabel('electronics')).toContain('Electronics'));
  it('returns emoji label for beauty', () => expect(getCategoryLabel('beauty')).toContain('Beauty'));
  it('returns general label for unknown', () => expect(getCategoryLabel('xyz')).toContain('All'));
  it('returns general label for general', () => expect(getCategoryLabel('general')).toContain('All'));
});

describe('CATEGORY_KEYWORDS structure', () => {
  it('has at least 6 categories', () => expect(Object.keys(CATEGORY_KEYWORDS).length).toBeGreaterThanOrEqual(6));
  it('each category has an array of keywords', () => {
    Object.values(CATEGORY_KEYWORDS).forEach(kws => {
      expect(Array.isArray(kws)).toBe(true);
      expect(kws.length).toBeGreaterThan(0);
    });
  });
});
