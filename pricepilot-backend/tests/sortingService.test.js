/**
 * Unit tests – Sorting Service
 * @file tests/sortingService.test.js
 */

const { sortProducts, validSortKeys } = require('../services/sorting.service');

const BASE_PRODUCTS = [
  {
    productId: 'a',
    productName: 'Banana Phone',
    platform: 'amazon',
    currentPrice: 5000,
    finalPayablePrice: 4500,
    rating: 3.5,
    discountPercentage: 10,
    fetchedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    productId: 'b',
    productName: 'Apple Watch',
    platform: 'flipkart',
    currentPrice: 30000,
    finalPayablePrice: 27000,
    rating: 4.8,
    discountPercentage: 25,
    fetchedAt: '2025-06-01T00:00:00.000Z'
  },
  {
    productId: 'c',
    productName: 'Cherry Speaker',
    platform: 'croma',
    currentPrice: 2000,
    finalPayablePrice: 1800,
    rating: 4.0,
    discountPercentage: 40,
    fetchedAt: '2025-03-01T00:00:00.000Z'
  }
];

describe('sortProducts', () => {
  it('sorts by lowestPrice (finalPayablePrice ascending)', () => {
    const result = sortProducts(BASE_PRODUCTS, 'lowestPrice');
    expect(result.map((p) => p.productId)).toEqual(['c', 'a', 'b']);
  });

  it('sorts by lowestListingPrice (currentPrice ascending)', () => {
    const result = sortProducts(BASE_PRODUCTS, 'lowestListingPrice');
    expect(result.map((p) => p.productId)).toEqual(['c', 'a', 'b']);
  });

  it('sorts by highestRating (rating descending)', () => {
    const result = sortProducts(BASE_PRODUCTS, 'highestRating');
    expect(result.map((p) => p.productId)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by highestDiscount (discountPercentage descending)', () => {
    const result = sortProducts(BASE_PRODUCTS, 'highestDiscount');
    expect(result.map((p) => p.productId)).toEqual(['c', 'b', 'a']);
  });

  it('sorts alphabetically by platform', () => {
    const result = sortProducts(BASE_PRODUCTS, 'platform');
    expect(result.map((p) => p.platform)).toEqual(['amazon', 'croma', 'flipkart']);
  });

  it('sorts alphabetically by productName', () => {
    const result = sortProducts(BASE_PRODUCTS, 'alphabetical');
    expect(result.map((p) => p.productName)).toEqual(['Apple Watch', 'Banana Phone', 'Cherry Speaker']);
  });

  it('sorts by newest (most recent fetchedAt first)', () => {
    const result = sortProducts(BASE_PRODUCTS, 'newest');
    expect(result.map((p) => p.productId)).toEqual(['b', 'c', 'a']);
  });

  it('falls back to lowestPrice for unknown sort key', () => {
    const result = sortProducts(BASE_PRODUCTS, 'unknownKey');
    expect(result.map((p) => p.productId)).toEqual(['c', 'a', 'b']);
  });

  it('does not mutate the original array', () => {
    const original = [...BASE_PRODUCTS];
    sortProducts(BASE_PRODUCTS, 'highestRating');
    expect(BASE_PRODUCTS).toEqual(original);
  });
});

describe('validSortKeys', () => {
  it('returns an array of strings', () => {
    const keys = validSortKeys();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('includes all expected sort strategies', () => {
    const keys = validSortKeys();
    ['lowestPrice', 'highestRating', 'highestDiscount', 'alphabetical', 'newest'].forEach((key) => {
      expect(keys).toContain(key);
    });
  });
});
