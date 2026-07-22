/**
 * @file tests/phase3.verification.test.js
 * @description Phase 3 Search Pipeline Verification Tests
 *
 * These tests verify the 6 specific problems fixed in Phase 3:
 *
 *  Problem 1: iPhone 16 — Amazon & Vijay Sales results disappearing
 *  Problem 2: "keyboard" — generic electronics search returns no results
 *  Problem 3: "cleanser" — generic beauty search returns no results
 *  Problem 4: "1kg dates" — grocery quantity search returns no results
 *  Problem 5: "500ml Olive Oil" — quantity not parsed, different sizes grouped together
 *  Problem 6: "Nike Shoes" — wrong providers selected, no results
 *
 * Run: npm test -- --testPathPattern=phase3.verification
 */

const { parseSearchIntent, detectSearchMode } = require('../services/searchIntent.service');
const { applySearchRelevance, THRESHOLDS } = require('../services/searchRelevance.service');
const { groupProducts } = require('../services/productGrouping.service');
const { getProvidersForCategory } = require('../config/providerCapabilities');
const { normalizeProduct } = require('../services/normalization.service');

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeProduct(overrides) {
  return {
    productName: 'Generic Product',
    brand: '',
    currentPrice: 999,
    originalPrice: 999,
    discountPercentage: 0,
    rating: 4.0,
    reviewCount: 100,
    image: 'https://example.com/img.jpg',
    productUrl: 'https://example.com/product',
    availability: true,
    category: 'general',
    platform: 'amazon',
    ...overrides
  };
}

// ─── PROBLEM 1: iPhone 16 ─────────────────────────────────────────────────────

describe('Problem 1 — iPhone 16: exact-mode threshold allows iPhone 16 from all stores', () => {
  const intent = parseSearchIntent('iPhone 16');
  const products = [
    makeProduct({ productId: 'amz-1', productName: 'Apple iPhone 16 128GB Black', brand: 'Apple', platform: 'amazon' }),
    makeProduct({ productId: 'fk-1',  productName: 'Apple iPhone 16 (Black, 128GB)', brand: 'Apple', platform: 'flipkart' }),
    makeProduct({ productId: 'vs-1',  productName: 'Apple iPhone 16 128GB', brand: 'Apple', platform: 'vijaysales' }),
    makeProduct({ productId: 'cr-1',  productName: 'Apple iPhone 15 128GB Black', brand: 'Apple', platform: 'croma' }),
    makeProduct({ productId: 'ss-1',  productName: 'Samsung Galaxy S25 256GB', brand: 'Samsung', platform: 'amazon' }),
  ];

  it('search mode is "exact" (brand + no explicit model is still exact because Apple:iPhone alias)', () => {
    expect(intent.searchMode).toBe('exact');
  });

  it('main threshold is 65 (not 72)', () => {
    expect(THRESHOLDS.exact).toBe(65);
  });

  it('brand is detected as Apple', () => {
    expect(intent.brand).toBe('Apple');
  });

  it('category is electronics', () => {
    expect(intent.category).toBe('electronics');
  });

  it('all iPhone 16 products from all stores appear in main results', () => {
    const result = applySearchRelevance(products, intent);
    const mainIds = result.mainProducts.map((p) => p.productId);
    expect(mainIds).toContain('amz-1');   // Amazon
    expect(mainIds).toContain('fk-1');    // Flipkart
    expect(mainIds).toContain('vs-1');    // Vijay Sales
  });

  it('Samsung Galaxy does not appear in main results for iPhone 16 search', () => {
    const result = applySearchRelevance(products, intent);
    const mainIds = result.mainProducts.map((p) => p.productId);
    expect(mainIds).not.toContain('ss-1');
  });

  it('iPhone 15 appears in results (main or related) as a close match', () => {
    const result = applySearchRelevance(products, intent);
    const allIds = [
      ...result.mainProducts.map((p) => p.productId),
      ...result.relatedProducts.map((p) => p.productId)
    ];
    expect(allIds).toContain('cr-1');
  });

  it('electronics provider routing includes Vijay Sales', () => {
    const providers = getProvidersForCategory('electronics');
    expect(providers).toContain('vijaysales');
    expect(providers).toContain('amazon');
    expect(providers).toContain('flipkart');
    expect(providers).toContain('croma');
  });
});

// ─── PROBLEM 2: keyboard ──────────────────────────────────────────────────────

describe('Problem 2 — keyboard: generic electronics search returns results', () => {
  const intent = parseSearchIntent('keyboard');

  it('search mode is "generic" (no brand, product type = keyboard)', () => {
    expect(intent.searchMode).toBe('generic');
  });

  it('product type is detected as "keyboard"', () => {
    expect(intent.productType).toBe('keyboard');
  });

  it('category is electronics', () => {
    expect(intent.category).toBe('electronics');
  });

  it('generic threshold is 15 (very permissive)', () => {
    expect(THRESHOLDS.generic).toBe(15);
  });

  it('keyboard products pass the generic threshold', () => {
    const products = [
      makeProduct({ productId: 'kb-1', productName: 'Logitech MK295 Wireless Keyboard', brand: 'Logitech', platform: 'amazon', category: 'electronics' }),
      makeProduct({ productId: 'kb-2', productName: 'Mechanical Gaming Keyboard RGB', brand: 'Corsair', platform: 'flipkart', category: 'electronics' }),
      makeProduct({ productId: 'kb-3', productName: 'Dell USB Wired Keyboard', brand: 'Dell', platform: 'croma', category: 'electronics' }),
    ];
    const result = applySearchRelevance(products, intent);
    expect(result.mainProducts.length).toBe(3);
    result.mainProducts.forEach((p) => {
      expect(p.relevanceScore).toBeGreaterThanOrEqual(15);
    });
  });

  it('provider routing for electronics includes Amazon, Flipkart, Croma, Reliance, Vijay Sales', () => {
    const providers = getProvidersForCategory('electronics');
    expect(providers).toContain('amazon');
    expect(providers).toContain('flipkart');
    expect(providers).toContain('croma');
    expect(providers).toContain('reliancedigital');
    expect(providers).toContain('vijaysales');
  });
});

// ─── PROBLEM 3: cleanser ──────────────────────────────────────────────────────

describe('Problem 3 — cleanser: generic beauty search returns results', () => {
  const intent = parseSearchIntent('cleanser');

  it('search mode is "generic"', () => {
    expect(intent.searchMode).toBe('generic');
  });

  it('product type is "cleanser"', () => {
    expect(intent.productType).toBe('cleanser');
  });

  it('category is beauty', () => {
    expect(intent.category).toBe('beauty');
  });

  it('productCore is "cleanser"', () => {
    expect(intent.productCore).toBe('cleanser');
  });

  it('cleanser products score above generic threshold (15)', () => {
    const products = [
      makeProduct({ productId: 'cl-1', productName: 'Cetaphil Gentle Skin Cleanser 250ml', brand: 'Cetaphil', platform: 'nykaa', category: 'beauty' }),
      makeProduct({ productId: 'cl-2', productName: 'Mamaearth Vitamin C Face Wash Cleanser', brand: 'Mamaearth', platform: 'amazon', category: 'beauty' }),
      makeProduct({ productId: 'cl-3', productName: 'Simple Kind to Skin Facial Cleanser', brand: 'Simple', platform: 'purplle', category: 'beauty' }),
    ];
    const result = applySearchRelevance(products, intent);
    expect(result.mainProducts.length).toBe(3);
    result.mainProducts.forEach((p) => {
      expect(p.relevanceScore).toBeGreaterThanOrEqual(15);
    });
  });

  it('beauty providers are Nykaa, Purplle, Tira, Amazon (NOT Flipkart)', () => {
    const providers = getProvidersForCategory('beauty');
    expect(providers).toContain('nykaa');
    expect(providers).toContain('purplle');
    expect(providers).toContain('tira');
    expect(providers).toContain('amazon');
    expect(providers).not.toContain('flipkart');  // Flipkart removed from beauty routing
  });

  it('brand penalty does NOT apply for generic searches (no brand in query)', () => {
    const product = makeProduct({ productName: 'Cetaphil Gentle Skin Cleanser', brand: 'Cetaphil', category: 'beauty', platform: 'nykaa' });
    const scored = applySearchRelevance([product], intent);
    // Should not be penalised for not matching a query brand (there is none)
    expect(scored.mainProducts.length).toBe(1);
  });
});

// ─── PROBLEM 4: 1kg dates ────────────────────────────────────────────────────

describe('Problem 4 — 1kg dates: grocery quantity search returns results', () => {
  const intent = parseSearchIntent('1kg dates');

  it('search mode is "generic"', () => {
    expect(intent.searchMode).toBe('generic');
  });

  it('category is groceries', () => {
    expect(intent.category).toBe('groceries');
  });

  it('product type is "dates"', () => {
    expect(intent.productType).toBe('dates');
  });

  it('quantity is extracted as "1 kg"', () => {
    expect(intent.quantity).toBe('1 kg');
  });

  it('productCore contains "dates"', () => {
    expect(intent.productCore).toContain('dates');
  });

  it('grocery products score above threshold and appear in main results', () => {
    const products = [
      makeProduct({ productId: 'dt-1', productName: 'Happilo Premium Medjool Dates 1kg', brand: 'Happilo', platform: 'bigbasket', category: 'groceries' }),
      makeProduct({ productId: 'dt-2', productName: 'Farmley Khajoor Dates 1 kg', brand: 'Farmley', platform: 'amazon', category: 'groceries' }),
      makeProduct({ productId: 'dt-3', productName: 'Nutraj Seedless Dates 1kg', brand: 'Nutraj', platform: 'blinkit', category: 'groceries' }),
    ];
    const result = applySearchRelevance(products, intent);
    expect(result.mainProducts.length).toBe(3);
    result.mainProducts.forEach((p) => expect(p.relevanceScore).toBeGreaterThanOrEqual(15));
  });

  it('grocery providers are BigBasket, Blinkit, Zepto, JioMart, Amazon (NOT Flipkart)', () => {
    const providers = getProvidersForCategory('groceries');
    expect(providers).toContain('bigbasket');
    expect(providers).toContain('blinkit');
    expect(providers).toContain('zepto');
    expect(providers).toContain('jiomart');
    expect(providers).toContain('amazon');
    expect(providers).not.toContain('flipkart');  // Flipkart removed from grocery routing
  });
});

// ─── PROBLEM 5: 500ml Olive Oil — quantity parsing & grouping isolation ───────

describe('Problem 5 — Olive Oil 500ml: quantity parsing and no cross-size grouping', () => {
  const intent = parseSearchIntent('Olive Oil 500ml');

  it('search mode is "generic"', () => {
    expect(intent.searchMode).toBe('generic');
  });

  it('category is groceries', () => {
    expect(intent.category).toBe('groceries');
  });

  it('product type is "olive_oil"', () => {
    expect(intent.productType).toBe('olive_oil');
  });

  it('quantity is extracted as "500 ml"', () => {
    expect(intent.quantity).toBe('500 ml');
  });

  it('productCore contains "olive oil"', () => {
    expect(intent.productCore).toContain('olive');
  });

  it('500ml and 1L olive oil products are NOT grouped together', () => {
    const raw = [
      { productName: 'Fortune Olive Oil 500ml',           brand: 'Fortune', currentPrice: 299, productUrl: 'https://amazon.com/1', platform: 'amazon',    availability: true, category: 'groceries', originalPrice: 299, discountPercentage: 0, rating: 4, reviewCount: 100, image: '' },
      { productName: 'Fortune Olive Oil 1 litre',          brand: 'Fortune', currentPrice: 549, productUrl: 'https://bigbasket.com/1', platform: 'bigbasket', availability: true, category: 'groceries', originalPrice: 549, discountPercentage: 0, rating: 4, reviewCount: 80, image: '' },
      { productName: 'Fortune Extra Virgin Olive Oil 500ml', brand: 'Fortune', currentPrice: 320, productUrl: 'https://blinkit.com/1', platform: 'blinkit', availability: true, category: 'groceries', originalPrice: 320, discountPercentage: 0, rating: 4, reviewCount: 60, image: '' },
    ];
    const products = raw.map((p) => normalizeProduct(p, p.platform, 'mock'));
    const groups = groupProducts(products);

    // 500ml and 1L must be separate groups
    expect(groups.length).toBeGreaterThanOrEqual(2);

    const groupNames = groups.map((g) => g.productName.toLowerCase());
    const has500ml = groupNames.some((n) => n.includes('500'));
    const has1L    = groupNames.some((n) => n.includes('1') && (n.includes('litre') || n.includes('liter') || n.includes('l ')));

    // Both sizes should be present as separate groups
    expect(has500ml).toBe(true);
    expect(has1L).toBe(true);
  });

  it('500ml from multiple stores ARE grouped together (same quantity, same brand)', () => {
    const raw = [
      { productName: 'Fortune Olive Oil 500ml', brand: 'Fortune', currentPrice: 299, productUrl: 'https://amazon.com/2', platform: 'amazon', availability: true, category: 'groceries', originalPrice: 299, discountPercentage: 0, rating: 4, reviewCount: 100, image: '' },
      { productName: 'Fortune Olive Oil 500ml', brand: 'Fortune', currentPrice: 310, productUrl: 'https://zepto.com/2', platform: 'zepto', availability: true, category: 'groceries', originalPrice: 310, discountPercentage: 0, rating: 4, reviewCount: 50, image: '' },
    ];
    const products = raw.map((p) => normalizeProduct(p, p.platform, 'mock'));
    const groups = groupProducts(products);

    // Same product (same brand, same quantity) should be grouped — 1 group with 2 stores
    expect(groups.length).toBe(1);
    expect(groups[0].stores.length).toBe(2);
  });
});

// ─── PROBLEM 6: Nike Shoes ────────────────────────────────────────────────────

describe('Problem 6 — Nike Shoes: branded fashion search with correct providers', () => {
  const intent = parseSearchIntent('Nike Shoes');

  it('search mode is "branded"', () => {
    expect(intent.searchMode).toBe('branded');
  });

  it('brand is detected as Nike', () => {
    expect(intent.brand).toBe('Nike');
  });

  it('product type is "shoes"', () => {
    expect(intent.productType).toBe('shoes');
  });

  it('category is fashion', () => {
    expect(intent.category).toBe('fashion');
  });

  it('branded threshold is 40', () => {
    expect(THRESHOLDS.branded).toBe(40);
  });

  it('Nike products score above branded threshold (40)', () => {
    const products = [
      makeProduct({ productId: 'nk-1', productName: 'Nike Air Max 270 Running Shoes', brand: 'Nike', platform: 'myntra', category: 'fashion' }),
      makeProduct({ productId: 'nk-2', productName: 'Nike Flex Experience Run 11 Shoes', brand: 'Nike', platform: 'amazon', category: 'fashion' }),
      makeProduct({ productId: 'ad-1', productName: 'Adidas Ultraboost 22 Running Shoes', brand: 'Adidas', platform: 'ajio', category: 'fashion' }),
    ];
    const result = applySearchRelevance(products, intent);
    const mainIds = result.mainProducts.map((p) => p.productId);

    expect(mainIds).toContain('nk-1');   // Nike Myntra ✓
    expect(mainIds).toContain('nk-2');   // Nike Amazon ✓
    expect(mainIds).not.toContain('ad-1'); // Adidas filtered out ✓
  });

  it('fashion providers include Myntra, AJIO, Meesho, Amazon, Flipkart', () => {
    const providers = getProvidersForCategory('fashion');
    expect(providers).toContain('myntra');
    expect(providers).toContain('ajio');
    expect(providers).toContain('meesho');
    expect(providers).toContain('amazon');
    expect(providers).toContain('flipkart');
  });
});

// ─── CROSS-CUTTING: Search mode thresholds ────────────────────────────────────

describe('Search mode threshold contract', () => {
  it('exact mode threshold is 65 (strict)', () => {
    expect(THRESHOLDS.exact).toBe(65);
  });

  it('branded mode threshold is 40 (moderate)', () => {
    expect(THRESHOLDS.branded).toBe(40);
  });

  it('generic mode threshold is 15 (permissive)', () => {
    expect(THRESHOLDS.generic).toBe(15);
  });

  it('category mode threshold is 0 (all pass)', () => {
    expect(THRESHOLDS.category).toBe(0);
  });

  it('exact < branded < generic strict ordering is maintained', () => {
    expect(THRESHOLDS.exact).toBeGreaterThan(THRESHOLDS.branded);
    expect(THRESHOLDS.branded).toBeGreaterThan(THRESHOLDS.generic);
    expect(THRESHOLDS.generic).toBeGreaterThan(THRESHOLDS.category);
  });
});

// ─── CROSS-CUTTING: Intent parsing accuracy ───────────────────────────────────

describe('Intent parsing — all 6 problem queries', () => {
  const cases = [
    { query: 'iPhone 16',        expectedMode: 'exact',    expectedCategory: 'electronics', expectedBrand: 'Apple' },
    { query: 'keyboard',         expectedMode: 'generic',  expectedCategory: 'electronics', expectedBrand: '' },
    { query: 'cleanser',         expectedMode: 'generic',  expectedCategory: 'beauty',      expectedBrand: '' },
    { query: '1kg dates',        expectedMode: 'generic',  expectedCategory: 'groceries',   expectedBrand: '' },
    { query: 'Olive Oil 500ml',  expectedMode: 'generic',  expectedCategory: 'groceries',   expectedBrand: '' },
    { query: 'Nike Shoes',       expectedMode: 'branded',  expectedCategory: 'fashion',     expectedBrand: 'Nike' },
  ];

  cases.forEach(({ query, expectedMode, expectedCategory, expectedBrand }) => {
    it(`"${query}" → mode=${expectedMode}, category=${expectedCategory}, brand=${expectedBrand || '(none)'}`, () => {
      const intent = parseSearchIntent(query);
      expect(intent.searchMode).toBe(expectedMode);
      expect(intent.category).toBe(expectedCategory);
      expect(intent.brand).toBe(expectedBrand);
    });
  });
});

// ─── CROSS-CUTTING: Provider routing isolation ────────────────────────────────

describe('Provider routing — category isolation', () => {
  it('medicine: routes to Apollo, PharmEasy, Tata1mg, Netmeds, Amazon — NOT Flipkart', () => {
    const providers = getProvidersForCategory('medicine');
    expect(providers).toContain('apollo');
    expect(providers).toContain('pharmeasy');
    expect(providers).toContain('tata1mg');
    expect(providers).toContain('netmeds');
    expect(providers).toContain('amazon');
    expect(providers).not.toContain('flipkart');
  });

  it('groceries: routes to BigBasket, Blinkit, Zepto, JioMart, Amazon — NOT Flipkart', () => {
    const providers = getProvidersForCategory('groceries');
    expect(providers).toContain('bigbasket');
    expect(providers).toContain('blinkit');
    expect(providers).toContain('zepto');
    expect(providers).toContain('jiomart');
    expect(providers).toContain('amazon');
    expect(providers).not.toContain('flipkart');
  });

  it('beauty: routes to Nykaa, Purplle, Tira, Amazon — NOT Flipkart', () => {
    const providers = getProvidersForCategory('beauty');
    expect(providers).toContain('nykaa');
    expect(providers).toContain('purplle');
    expect(providers).toContain('tira');
    expect(providers).toContain('amazon');
    expect(providers).not.toContain('flipkart');
  });

  it('electronics: routes to Amazon, Flipkart, Croma, Reliance, Vijay Sales', () => {
    const providers = getProvidersForCategory('electronics');
    expect(providers).toContain('amazon');
    expect(providers).toContain('flipkart');
    expect(providers).toContain('croma');
    expect(providers).toContain('reliancedigital');
    expect(providers).toContain('vijaysales');
  });

  it('fashion: routes to Myntra, AJIO, Meesho, Amazon, Flipkart', () => {
    const providers = getProvidersForCategory('fashion');
    expect(providers).toContain('myntra');
    expect(providers).toContain('ajio');
    expect(providers).toContain('meesho');
    expect(providers).toContain('amazon');
    expect(providers).toContain('flipkart');
  });
});

// ─── REGRESSION: Known-good queries must still work ──────────────────────────

describe('Regression — previously working queries must still work', () => {
  it('Cetaphil Cleanser 250ml — brand+product+quantity = exact mode', () => {
    const intent = parseSearchIntent('Cetaphil Cleanser 250ml');
    expect(intent.searchMode).toBe('exact');
    expect(intent.brand).toBe('Cetaphil');
    expect(intent.productType).toBe('cleanser');
    expect(intent.quantity).toBe('250 ml');
  });

  it('Motorola Edge 50 Fusion 256GB — brand+family+variant = exact mode', () => {
    const intent = parseSearchIntent('Motorola Edge 50 Fusion 256GB');
    expect(intent.searchMode).toBe('exact');
    expect(intent.brand).toBe('Motorola');
    expect(intent.variant).toContain('256 gb');
  });

  it('Samsung TV — brand+product type = branded mode', () => {
    const intent = parseSearchIntent('Samsung TV');
    expect(intent.searchMode).toBe('branded');
    expect(intent.brand).toBe('Samsung');
  });

  it('Paracetamol 650 — medicine brand identified', () => {
    const intent = parseSearchIntent('Paracetamol 650');
    expect(intent.category).toBe('medicine');
    expect(intent.productType).toBe('paracetamol');
  });

  it('Dolo 650 — medicine brand detected', () => {
    const intent = parseSearchIntent('Dolo 650');
    expect(intent.category).toBe('medicine');
  });

  it('Nike Shoes Size 9 — size variant extracted', () => {
    const intent = parseSearchIntent('Nike Shoes Size 9');
    expect(intent.category).toBe('fashion');
    expect(intent.productType).toBe('shoes');
    expect(intent.size).toBe('size 9');
  });

  it('Lloyd AC 1.5 Ton 3 Star — AC capacity and star variant', () => {
    const intent = parseSearchIntent('Lloyd AC 1.5 Ton 3 Star');
    expect(intent.brand).toBe('Lloyd');
    expect(intent.variant).toContain('1.5 ton');
    expect(intent.variant).toContain('3 star');
  });
});
