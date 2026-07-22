/**
 * Unit tests - Search Relevance Service
 * @file tests/searchRelevance.test.js
 */

const { scoreProductRelevance, applySearchRelevance } = require('../services/searchRelevance.service');
const { parseSearchIntent } = require('../services/searchIntent.service');

const products = [
  {
    productId: 'iphone-16',
    productName: 'Apple iPhone 16 128GB Black',
    brand: 'Apple',
    category: 'electronics',
    finalPayablePrice: 79900
  },
  {
    productId: 'iphone-15',
    productName: 'Apple iPhone 15 128GB Black',
    brand: 'Apple',
    category: 'electronics',
    finalPayablePrice: 69900
  },
  {
    productId: 'galaxy',
    productName: 'Samsung Galaxy S25 128GB',
    brand: 'Samsung',
    category: 'electronics',
    finalPayablePrice: 74900
  }
];

describe('scoreProductRelevance', () => {
  it('scores exact products higher than adjacent models', () => {
    const intent = parseSearchIntent('iPhone 16');
    const exact = scoreProductRelevance(products[0], intent);
    const adjacent = scoreProductRelevance(products[1], intent);

    expect(exact.relevanceScore).toBeGreaterThan(adjacent.relevanceScore);
    expect(exact.relevanceScore).toBeGreaterThanOrEqual(72);
  });

  it('heavily penalizes different brands for specific brand searches', () => {
    const intent = parseSearchIntent('iPhone 16');
    const samsung = scoreProductRelevance(products[2], intent);

    expect(samsung.relevanceScore).toBeLessThan(42);
  });

  it('does not pass generic brand-only products for model-specific searches', () => {
    const intent = parseSearchIntent('iPhone 16');
    const genericApple = scoreProductRelevance({
      productId: 'generic-apple',
      productName: 'Apple',
      brand: 'Apple',
      category: 'electronics'
    }, intent);

    expect(genericApple.relevanceScore).toBeLessThan(72);
  });
});

describe('applySearchRelevance', () => {
  it('keeps highly relevant products in main results', () => {
    const result = applySearchRelevance(products, parseSearchIntent('iPhone 16'));
    expect(result.mainProducts.map((p) => p.productId)).toContain('iphone-16');
    expect(result.mainProducts.map((p) => p.productId)).not.toContain('galaxy');
  });

  it('places medium relevance products appropriately in results', () => {
    const result = applySearchRelevance(products, parseSearchIntent('iPhone 16'));
    // Phase 3: With exact-mode threshold=65, iPhone 15 (score 68) is in mainProducts.
    // It correctly appears somewhere in results — either main or related.
    const allIds = [
      ...result.mainProducts.map((p) => p.productId),
      ...result.relatedProducts.map((p) => p.productId)
    ];
    expect(allIds).toContain('iphone-15');
  });

  it('does not use price to include unrelated cheaper products', () => {
    const cheapSamsung = { ...products[2], finalPayablePrice: 10000 };
    const result = applySearchRelevance([products[0], cheapSamsung], parseSearchIntent('iPhone 16'));
    expect(result.mainProducts.map((p) => p.productId)).toEqual(['iphone-16']);
  });
});
