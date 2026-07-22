/**
 * Unit tests - Product Grouping Service
 * @file tests/productGrouping.test.js
 */

const { groupProducts, extractVariant } = require('../services/productGrouping.service');

function product(overrides) {
  return {
    productId: overrides.productId,
    productName: overrides.productName,
    brand: overrides.brand !== undefined ? overrides.brand : 'Apple',
    platform: overrides.platform || 'amazon',
    category: overrides.category || 'electronics',
    currentPrice: overrides.currentPrice || overrides.finalPayablePrice,
    finalPayablePrice: overrides.finalPayablePrice,
    rating: overrides.rating || 0,
    reviewCount: overrides.reviewCount || 0,
    availability: overrides.availability !== false,
    productUrl: overrides.productUrl || `https://example.com/${overrides.productId}`,
    offers: overrides.offers || [],
    image: overrides.image || ''
  };
}

describe('extractVariant', () => {
  it('extracts storage and colour variants from product names', () => {
    expect(extractVariant('Apple iPhone 16 128GB Black')).toContain('128 gb');
    expect(extractVariant('Apple iPhone 16 128GB Black')).toContain('black');
  });
});

describe('groupProducts', () => {
  it('groups matching products and marks the cheapest store as best deal', () => {
    const groups = groupProducts([
      product({
        productId: 'amazon-iphone',
        productName: 'Apple iPhone 16 128GB Black',
        platform: 'amazon',
        finalPayablePrice: 79900,
        rating: 4.5
      }),
      product({
        productId: 'flipkart-iphone',
        productName: 'Apple iPhone 16 128 GB Black Smartphone',
        platform: 'flipkart',
        finalPayablePrice: 76900,
        rating: 4.4
      })
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].stores).toHaveLength(2);
    expect(groups[0].bestDeal.platform).toBe('flipkart');
    expect(groups[0].stores[0].isBestDeal).toBe(true);
  });

  it('groups equivalent iPhone listings across electronics stores', () => {
    const groups = groupProducts([
      product({
        productId: 'amazon-iphone-16',
        productName: 'Apple iPhone 16 128GB Black',
        platform: 'amazon',
        finalPayablePrice: 70900
      }),
      product({
        productId: 'flipkart-iphone-16',
        productName: 'Apple iPhone 16 (128 GB, Black)',
        platform: 'flipkart',
        finalPayablePrice: 71499
      }),
      product({
        productId: 'croma-iphone-16',
        productName: 'Apple iPhone 16 128 GB Black',
        platform: 'croma',
        finalPayablePrice: 72490
      }),
      product({
        productId: 'reliance-iphone-16',
        productName: 'Apple iPhone 16 Black 128GB',
        platform: 'reliancedigital',
        finalPayablePrice: 72490
      }),
      product({
        productId: 'vijay-iphone-16',
        productName: 'Apple iPhone 16 128GB Black',
        platform: 'vijaysales',
        finalPayablePrice: 72200
      })
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].stores.map((store) => store.platform).sort()).toEqual([
      'amazon',
      'croma',
      'flipkart',
      'reliancedigital',
      'vijaysales'
    ]);
  });

  it('groups matching store listings even when one provider omits brand', () => {
    const groups = groupProducts([
      product({
        productId: 'amazon-iphone-no-brand',
        productName: 'iPhone 16 128GB Black',
        brand: '',
        platform: 'amazon',
        finalPayablePrice: 70900
      }),
      product({
        productId: 'flipkart-iphone-with-brand',
        productName: 'Apple iPhone 16 (128 GB, Black)',
        brand: 'Apple',
        platform: 'flipkart',
        finalPayablePrice: 71499
      })
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].stores.map((store) => store.platform).sort()).toEqual(['amazon', 'flipkart']);
  });

  it('keeps storage and colour variants in separate comparison groups', () => {
    const groups = groupProducts([
      product({
        productId: 'iphone-128-black',
        productName: 'Apple iPhone 16 128GB Black',
        finalPayablePrice: 70900
      }),
      product({
        productId: 'iphone-256-black',
        productName: 'Apple iPhone 16 256GB Black',
        platform: 'flipkart',
        finalPayablePrice: 80900
      }),
      product({
        productId: 'iphone-128-blue',
        productName: 'Apple iPhone 16 128GB Blue',
        platform: 'croma',
        finalPayablePrice: 71900
      })
    ]);

    expect(groups).toHaveLength(3);
    expect(groups.map((group) => group.variant).sort()).toEqual([
      '128 gb black',
      '128 gb blue',
      '256 gb black'
    ]);
  });

  it('keeps grocery weights and pack sizes in separate comparison groups', () => {
    const groups = groupProducts([
      product({
        productId: 'dates-500g',
        productName: 'Happilo Dates 500g',
        brand: 'Happilo',
        category: 'groceries',
        finalPayablePrice: 199
      }),
      product({
        productId: 'dates-1kg',
        productName: 'Happilo Dates 1kg',
        brand: 'Happilo',
        platform: 'bigbasket',
        category: 'groceries',
        finalPayablePrice: 349
      }),
      product({
        productId: 'dates-1kg-pack2',
        productName: 'Happilo Dates 1kg Pack of 2',
        brand: 'Happilo',
        platform: 'blinkit',
        category: 'groceries',
        finalPayablePrice: 679
      })
    ]);

    expect(groups).toHaveLength(3);
    expect(groups.map((group) => group.variant).sort()).toEqual([
      '1 kg',
      '1 kg pack of 2',
      '500 g'
    ]);
  });

  it('uses rating as a positive deal-score tie breaker for similarly priced groups', () => {
    const groups = groupProducts([
      product({
        productId: 'low-rated',
        productName: 'Apple iPhone 15 128GB Black',
        finalPayablePrice: 70000,
        rating: 3.5
      }),
      product({
        productId: 'high-rated',
        productName: 'Apple iPhone 16 128GB Black',
        finalPayablePrice: 70000,
        rating: 4.8
      })
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].productName).toBe('Apple iPhone 16 128GB Black');
  });
});
