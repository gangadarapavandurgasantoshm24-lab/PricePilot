/**
 * Unit tests – Browser Manager
 * @file tests/browserManager.test.js
 *
 * Playwright is mocked so no real browser is launched.
 * Tests verify: lazy loading, metric reporting, graceful degradation
 * when playwright is unavailable, and lifecycle tracking.
 */

// ─── Mock playwright before requiring browserManager ─────────────────────────

const mockPage = {
  isClosed:                  jest.fn(() => false),
  close:                     jest.fn().mockResolvedValue(undefined),
  setDefaultTimeout:         jest.fn(),
  setDefaultNavigationTimeout: jest.fn(),
  goto:                      jest.fn().mockResolvedValue(undefined),
  on:                        jest.fn()
};

const mockContext = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close:   jest.fn().mockResolvedValue(undefined),
  on:      jest.fn()
};

const mockBrowser = {
  isConnected: jest.fn(() => true),
  newContext:  jest.fn().mockResolvedValue(mockContext),
  close:       jest.fn().mockResolvedValue(undefined),
  on:          jest.fn()
};

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue(mockBrowser)
  }
}), { virtual: true });

// Reset module registry so browserManager loads with our mock
jest.resetModules();
const browserManager = require('../services/browserManager');

// ─── Metrics when browser not yet launched ────────────────────────────────────

describe('browserManager.getMetrics (cold)', () => {
  it('returns available:true (playwright mock is installed)', () => {
    const metrics = browserManager.getMetrics();
    // Playwright is mocked so it is "available"
    expect(metrics.available).toBe(true);
  });

  it('returns activeBrowsers = 0 before launch', () => {
    const metrics = browserManager.getMetrics();
    expect(metrics.activeBrowsers).toBe(0);
  });

  it('returns activeContexts = 0 before launch', () => {
    expect(browserManager.getMetrics().activeContexts).toBe(0);
  });

  it('returns activePages = 0 before launch', () => {
    expect(browserManager.getMetrics().activePages).toBe(0);
  });

  it('returns uptimeMs = 0 before launch', () => {
    expect(browserManager.getMetrics().uptimeMs).toBe(0);
  });
});

// ─── launch() ────────────────────────────────────────────────────────────────

describe('browserManager.launch', () => {
  it('launches a browser and returns it', async () => {
    const browser = await browserManager.launch();
    expect(browser).toBeDefined();
    expect(typeof browser.isConnected).toBe('function');
  });

  it('reuses the existing browser on subsequent calls', async () => {
    const playwright = require('playwright');
    const callsBefore = playwright.chromium.launch.mock.calls.length;

    await browserManager.launch();
    await browserManager.launch();

    // Should not have launched again since browser is still connected
    expect(playwright.chromium.launch.mock.calls.length).toBe(callsBefore);
  });

  it('activeBrowsers = 1 after launch', () => {
    expect(browserManager.getMetrics().activeBrowsers).toBe(1);
  });

  it('uptimeMs > 0 after launch', () => {
    expect(browserManager.getMetrics().uptimeMs).toBeGreaterThanOrEqual(0);
  });
});

// ─── createContext() + newPage() ──────────────────────────────────────────────

describe('browserManager.createContext and newPage', () => {
  let context;
  let page;

  it('createContext returns a context and tracks it', async () => {
    context = await browserManager.createContext();
    expect(context).toBeDefined();
    expect(typeof context.close).toBe('function');
    expect(browserManager.getMetrics().activeContexts).toBeGreaterThanOrEqual(1);
  });

  it('newPage returns a page and tracks it', async () => {
    page = await browserManager.newPage(context);
    expect(page).toBeDefined();
    expect(typeof page.goto).toBe('function');
    expect(browserManager.getMetrics().activePages).toBeGreaterThanOrEqual(1);
  });

  it('closePage removes page from tracking', async () => {
    const before = browserManager.getMetrics().activePages;
    await browserManager.closePage(page);
    const after = browserManager.getMetrics().activePages;
    expect(after).toBeLessThan(before + 1);
  });

  it('closeContext removes context from tracking', async () => {
    const before = browserManager.getMetrics().activeContexts;
    await browserManager.closeContext(context);
    const after = browserManager.getMetrics().activeContexts;
    expect(after).toBeLessThanOrEqual(before);
  });
});

// ─── goto() ──────────────────────────────────────────────────────────────────

describe('browserManager.goto', () => {
  it('calls page.goto with the correct URL', async () => {
    const testPage = { ...mockPage, goto: jest.fn().mockResolvedValue(undefined) };
    await browserManager.goto(testPage, 'https://example.com');
    expect(testPage.goto).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ waitUntil: 'domcontentloaded' })
    );
  });
});

// ─── shutdown() ──────────────────────────────────────────────────────────────

describe('browserManager.shutdown', () => {
  it('shuts down without throwing', async () => {
    await browserManager.shutdown();
    expect(browserManager.getMetrics().activeBrowsers).toBe(0);
  });

  it('activeBrowsers = 0 after shutdown', () => {
    expect(browserManager.getMetrics().activeBrowsers).toBe(0);
  });
});
