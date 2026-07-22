/**
 * Unit tests – Product Validator
 * @file tests/productValidator.test.js
 */

const { validateProduct, filterValidProducts, validateProductsWithDetails } = require('../utils/productValidator');

const validProduct = {
  productId: 'p1',
  productName: 'iPhone 16 Pro',
  image: 'https://example.com/image.jpg',
  productUrl: 'https://example.com/product',
  currentPrice: 119900,
  rating: 4.5
};

describe('validateProduct', () => {
  it('returns valid for a complete product', () => {
    const { valid, errors } = validateProduct({ ...validProduct });
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('rejects a product with no title', () => {
    const { valid, errors } = validateProduct({ ...validProduct, productName: '' });
    expect(valid).toBe(false);
    expect(errors).toContain('Missing title');
  });

  it('allows a product with missing image', () => {
    const { valid, errors } = validateProduct({ ...validProduct, image: '' });
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('rejects a product with an invalid image URL', () => {
    const { valid, errors } = validateProduct({ ...validProduct, image: 'not-a-url' });
    expect(valid).toBe(false);
    expect(errors).toContain('Invalid image URL');
  });

  it('rejects a product with missing URL', () => {
    const { valid, errors } = validateProduct({ ...validProduct, productUrl: '' });
    expect(valid).toBe(false);
    expect(errors).toContain('Missing URL');
  });

  it('rejects a product with zero price', () => {
    const { valid, errors } = validateProduct({ ...validProduct, currentPrice: 0 });
    expect(valid).toBe(false);
    expect(errors).toContain('Invalid price');
  });

  it('rejects a product with a negative price', () => {
    const { valid, errors } = validateProduct({ ...validProduct, currentPrice: -100 });
    expect(valid).toBe(false);
    expect(errors).toContain('Invalid price');
  });

  it('rejects a product with a rating above 5', () => {
    const { valid, errors } = validateProduct({ ...validProduct, rating: 6 });
    expect(valid).toBe(false);
    expect(errors).toContain('Invalid rating');
  });

  it('rejects a product with a negative rating', () => {
    const { valid, errors } = validateProduct({ ...validProduct, rating: -1 });
    expect(valid).toBe(false);
    expect(errors).toContain('Invalid rating');
  });

  it('rejects a duplicate product ID', () => {
    const seen = new Set(['p1']);
    const { valid, errors } = validateProduct({ ...validProduct }, seen);
    expect(valid).toBe(false);
    expect(errors).toContain('Duplicate ID');
  });
});

describe('filterValidProducts', () => {
  it('removes invalid products from an array', () => {
    const products = [
      { ...validProduct, productId: 'a1' },
      { ...validProduct, productId: 'a2', productName: '' }, // invalid
      { ...validProduct, productId: 'a3' }
    ];
    const result = filterValidProducts(products);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.productId)).toEqual(['a1', 'a3']);
  });

  it('removes duplicate IDs within the same batch', () => {
    const products = [
      { ...validProduct, productId: 'dup' },
      { ...validProduct, productId: 'dup' } // duplicate
    ];
    const result = filterValidProducts(products);
    expect(result).toHaveLength(1);
  });
});

describe('validateProductsWithDetails', () => {
  it('returns valid products plus diagnostic rejection counts', () => {
    const result = validateProductsWithDetails([
      { ...validProduct, productId: 'valid-1' },
      { ...validProduct, productId: 'missing-title', productName: '' },
      { ...validProduct, productId: 'bad-price', currentPrice: 0 },
      { ...validProduct, productId: 'valid-2' }
    ]);

    expect(result.validProducts).toHaveLength(2);
    expect(result.rejectedCount).toBe(2);
    expect(result.rejectionReasons).toEqual({
      'Missing title': 1,
      'Invalid price': 1
    });
  });
});
