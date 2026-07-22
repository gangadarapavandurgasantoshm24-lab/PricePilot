/**
 * Unit tests - Normalization Service
 * @file tests/normalization.test.js
 */

const { normalizeProduct } = require('../services/normalization.service');

describe('normalizeProduct', () => {
  it('infers real brand from title instead of preserving marketplace brand', () => {
    const product = normalizeProduct({
      productName: 'Apple iPhone 16 128GB Black',
      brand: 'Amazon',
      currentPrice: 67999,
      productUrl: 'https://www.amazon.in/dp/example'
    }, 'amazon', 'playwright');

    expect(product.brand).toBe('Apple');
    expect(product.platform).toBe('amazon');
    expect(product.productName).toBe('Apple iPhone 16 128GB Black');
  });

  it('keeps a valid non-marketplace brand', () => {
    const product = normalizeProduct({
      productName: 'Samsung Galaxy S25 128GB',
      brand: 'Samsung',
      currentPrice: 74999,
      productUrl: 'https://www.amazon.in/dp/example'
    }, 'amazon', 'playwright');

    expect(product.brand).toBe('Samsung');
  });
});
