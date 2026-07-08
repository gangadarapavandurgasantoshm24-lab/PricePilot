/**
 * Unit tests – Filtering Service
 * @file tests/filteringService.test.js
 */

const { filterProducts } = require('../services/filtering.service');

const BASE_PRODUCTS = [
  {
    productId: '1',
    productName: 'iPhone 16 Pro',
    brand: 'Apple',
    platform: 'amazon',
    category: 'electronics',
    currentPrice: 119900,
    rating: 4.8,
    discountPercentage: 5,
    availability: true
  },
  {
    productId: '2',
    productName: 'Samsung Galaxy S24',
    brand: 'Samsung',
    platform: 'flipkart',
    category: 'electronics',
    currentPrice: 79999,
    rating: 4.5,
    discountPercentage: 20,
    availability: true
  },
  {
    productId: '3',
    productName: 'Nike Air Max',
    brand: 'Nike',
    platform: 'myntra',
    category: 'footwear',
    currentPrice: 8999,
    rating: 4.0,
    discountPercentage: 30,
    availability: false
  }
];

describe('filterProducts', () => {
  it('returns all products when no filters provided', () => {
    expect(filterProducts(BASE_PRODUCTS, {})).toHaveLength(3);
  });

  it('filters by platform', () => {
    const result = filterProducts(BASE_PRODUCTS, { platform: 'amazon' });
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('1');
  });

  it('filters by brand (case-insensitive)', () => {
    const result = filterProducts(BASE_PRODUCTS, { brand: 'samsung' });
    expect(result).toHaveLength(1);
    expect(result[0].brand).toBe('Samsung');
  });

  it('filters by minimum price', () => {
    const result = filterProducts(BASE_PRODUCTS, { minPrice: 80000 });
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('1');
  });

  it('filters by maximum price', () => {
    const result = filterProducts(BASE_PRODUCTS, { maxPrice: 10000 });
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('3');
  });

  it('filters by price range', () => {
    const result = filterProducts(BASE_PRODUCTS, { minPrice: 70000, maxPrice: 100000 });
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('2');
  });

  it('filters by minimum rating', () => {
    const result = filterProducts(BASE_PRODUCTS, { minRating: 4.6 });
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('1');
  });

  it('filters by minimum discount', () => {
    const result = filterProducts(BASE_PRODUCTS, { minDiscount: 25 });
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('3');
  });

  it('filters by availability: true', () => {
    const result = filterProducts(BASE_PRODUCTS, { availability: 'true' });
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.availability)).toBe(true);
  });

  it('filters by availability: false', () => {
    const result = filterProducts(BASE_PRODUCTS, { availability: 'false' });
    expect(result).toHaveLength(1);
    expect(result[0].availability).toBe(false);
  });

  it('filters by category (partial match)', () => {
    const result = filterProducts(BASE_PRODUCTS, { category: 'electro' });
    expect(result).toHaveLength(2);
  });

  it('combines multiple filters correctly', () => {
    const result = filterProducts(BASE_PRODUCTS, {
      platform: 'flipkart',
      minRating: 4.0,
      availability: 'true'
    });
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('2');
  });
});
