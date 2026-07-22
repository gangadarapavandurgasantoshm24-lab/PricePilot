/**
 * Unit tests - Search Intent Service
 * @file tests/searchIntent.test.js
 */

const {
  parseSearchIntent,
  correctQuery,
  getSearchSuggestions,
  detectBrand,
  detectVariant
} = require('../services/searchIntent.service');

describe('parseSearchIntent', () => {
  it('parses iPhone searches into electronics intent', () => {
    const intent = parseSearchIntent('iPhone 16 128GB Black');
    expect(intent.brand).toBe('Apple');
    expect(intent.family).toBe('iPhone');
    expect(intent.model).toContain('16');
    expect(intent.variant).toContain('128 gb');
    expect(intent.category).toBe('electronics');
  });

  it('parses Motorola Edge 50 Fusion storage variant', () => {
    const intent = parseSearchIntent('Motorola Edge 50 Fusion 256GB');
    expect(intent.brand).toBe('Motorola');
    expect(intent.family).toBe('Edge');
    expect(intent.model).toContain('50');
    expect(intent.model).toContain('Fusion');
    expect(intent.variant).toContain('256 gb');
  });

  it('parses fashion brand and product type', () => {
    const intent = parseSearchIntent('Nike Shoes');
    expect(intent.brand).toBe('Nike');
    expect(intent.category).toBe('fashion');
    expect(intent.productType).toBe('shoes');
  });

  it('parses beauty brand and product type', () => {
    const intent = parseSearchIntent('Cetaphil Gentle Skin Cleanser');
    expect(intent.brand).toBe('Cetaphil');
    expect(intent.category).toBe('beauty');
    // Phase 3: 'cleanser' is now a first-class product type (more specific than the old 'skin_care')
    expect(intent.productType).toBe('cleanser');
  });

  it('parses AC capacity and star variant', () => {
    const intent = parseSearchIntent('Lloyd AC 1.5 Ton 3 Star');
    expect(intent.brand).toBe('Lloyd');
    expect(intent.variant).toContain('1.5 ton');
    expect(intent.variant).toContain('3 star');
  });

  it('parses grocery quantity intent', () => {
    const intent = parseSearchIntent('1kg Dates');
    expect(intent.category).toBe('groceries');
    // Phase 3: 'dates' is now a specific product type (more precise than the old generic 'dry_fruits')
    expect(intent.productType).toBe('dates');
    expect(intent.quantity).toBe('1 kg');
  });

  it('parses fashion shoe size intent', () => {
    const intent = parseSearchIntent('Nike Shoes Size 9');
    expect(intent.category).toBe('fashion');
    expect(intent.productType).toBe('shoes');
    expect(intent.size).toBe('size 9');
  });
});

describe('brand and variant helpers', () => {
  it('detects brands from aliases', () => {
    expect(detectBrand('iphone 16')).toBe('Apple');
    expect(detectBrand('moto edge 50')).toBe('Motorola');
  });

  it('detects storage, RAM, colour, TV and AC variants', () => {
    expect(detectVariant('Phone 8GB RAM 256GB Blue')).toContain('8 gb ram');
    expect(detectVariant('Samsung TV 55 Inch')).toContain('55 inch');
    expect(detectVariant('AC 1.5 Ton')).toContain('1.5 ton');
    expect(detectVariant('Almonds 500g Pack of 2')).toContain('500 g');
    expect(detectVariant('Almonds 500g Pack of 2')).toContain('pack of 2');
  });
});

describe('query correction and suggestions', () => {
  it('corrects common misspellings', () => {
    expect(correctQuery('Motorolo Edge')).toContain('motorola');
    expect(correctQuery('Cetafil Cleanser')).toContain('cetaphil');
    expect(correctQuery('Nikey Shoes')).toContain('nike');
  });

  it('returns query suggestions for partial searches', () => {
    expect(getSearchSuggestions('iph')).toContain('iPhone 16');
    expect(getSearchSuggestions('cet')).toContain('Cetaphil Gentle Skin Cleanser');
    expect(getSearchSuggestions('moto')).toContain('Motorola Edge 50 Fusion');
  });
});
