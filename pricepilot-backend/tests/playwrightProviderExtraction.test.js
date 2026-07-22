/**
 * Unit tests - Playwright Provider Extraction Helpers
 * @file tests/playwrightProviderExtraction.test.js
 */

const PlaywrightProvider = require('../providers/base/playwrightProvider');

class TestProvider extends PlaywrightProvider {
  get platform() { return 'test'; }
  get selectors() { return { searchUrl: () => 'https://example.com' }; }
  async extractProducts() { return []; }
}

describe('PlaywrightProvider extraction guards', () => {
  const provider = new TestProvider();

  it('rejects price-filter labels as non-products', () => {
    expect(provider.looksLikeNonProductTitle('Below Rs10000')).toBe(true);
    expect(provider.looksLikeNonProductTitle('Rs10001-20000')).toBe(true);
    expect(provider.looksLikeNonProductTitle('Price')).toBe(true);
  });

  it('keeps complete product titles', () => {
    expect(provider.looksLikeNonProductTitle('Apple iPhone 16 128GB Black')).toBe(false);
    expect(provider.looksLikeNonProductTitle('Samsung Galaxy S25 128GB')).toBe(false);
  });

  it('derives the real title from multiline cards with badges', () => {
    const title = provider.deriveTitleFromText([
      'Sponsored',
      'Apple iPhone 16 (Black, 128 GB)',
      '4.5 out of 5 stars',
      '₹67,999'
    ].join('\n'));

    expect(title).toBe('Apple iPhone 16 (Black, 128 GB)');
  });

  it('prefers complete product titles over one-word brand labels', () => {
    const title = provider.chooseBestTitle([
      'Apple',
      'Apple iPhone 16 (White, 128 GB)',
      'Price, product page'
    ], 'Apple iPhone 16 (White, 128 GB) ₹67999');

    expect(title).toBe('Apple iPhone 16 (White, 128 GB)');
  });
});
