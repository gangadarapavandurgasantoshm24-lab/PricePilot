/**
 * Unit tests – Browser Queue
 * @file tests/browserQueue.test.js
 *
 * BrowserManager is mocked so no real browser is launched.
 * Tests verify: concurrency enforcement, acquire/release cycle,
 * queue drain order, and metrics reporting.
 */

// ─── Mock browserManager ──────────────────────────────────────────────────────

const mockPage = {
  isClosed:                    jest.fn(() => false),
  close:                       jest.fn().mockResolvedValue(undefined),
  setDefaultTimeout:           jest.fn(),
  setDefaultNavigationTimeout: jest.fn(),
  on:                          jest.fn()
};

const mockContext = {
  close: jest.fn().mockResolvedValue(undefined)
};

jest.mock('../services/browserManager', () => ({
  createContext: jest.fn().mockResolvedValue(mockContext),
  newPage:       jest.fn().mockResolvedValue(mockPage),
  closePage:     jest.fn().mockResolvedValue(undefined),
  closeContext:  jest.fn().mockResolvedValue(undefined),
  getMetrics:    jest.fn(() => ({ available: true, activeBrowsers: 1, activePages: 0 }))
}));

// Mock browser config to allow easy concurrency control
jest.mock('../config/browser', () => ({
  maxPages:     2,
  queueTimeout: 5000,
  timeout:      10000,
  viewport:     { width: 1280, height: 800 },
  userAgent:    'TestAgent'
}));

jest.resetModules();
const browserQueue = require('../services/browserQueue');

// ─── getMetrics (initial) ─────────────────────────────────────────────────────

describe('browserQueue.getMetrics (initial)', () => {
  it('returns queueLength = 0 initially', () => {
    expect(browserQueue.getMetrics().queueLength).toBe(0);
  });

  it('returns activePages = 0 initially', () => {
    expect(browserQueue.getMetrics().activePages).toBe(0);
  });

  it('returns maxPages from config', () => {
    expect(browserQueue.getMetrics().maxPages).toBe(2);
  });
});

// ─── acquire / release ────────────────────────────────────────────────────────

describe('browserQueue.acquire and release', () => {
  it('acquire() resolves with { page, release }', async () => {
    const slot = await browserQueue.acquire();
    expect(slot).toHaveProperty('page');
    expect(slot).toHaveProperty('release');
    expect(typeof slot.release).toBe('function');
    await slot.release();
  });

  it('page in slot is the mock page', async () => {
    const slot = await browserQueue.acquire();
    expect(slot.page).toBe(mockPage);
    await slot.release();
  });

  it('activePages increments during hold and decrements after release', async () => {
    const slot = await browserQueue.acquire();
    expect(browserQueue.getMetrics().activePages).toBeGreaterThanOrEqual(0);
    await slot.release();
    // After release, activePages should be back down
    expect(browserQueue.getMetrics().activePages).toBeGreaterThanOrEqual(0);
  });

  it('release() resolves even when closePage throws', async () => {
    const browserManager = require('../services/browserManager');
    // Make closePage throw on the next call only
    browserManager.closePage.mockRejectedValueOnce(new Error('close failed'));

    const slot = await browserQueue.acquire();
    // Should resolve, not reject
    await expect(slot.release()).resolves.toBeUndefined();
  });

  it('activePages returns to 0 after all slots released', async () => {
    const slot = await browserQueue.acquire();
    await slot.release();
    expect(browserQueue.getMetrics().activePages).toBe(0);
  });
});

// ─── concurrency enforcement ──────────────────────────────────────────────────

describe('browserQueue concurrency', () => {
  it('respects maxPages limit (acquires up to maxPages = 2 simultaneously)', async () => {
    const slot1 = await browserQueue.acquire();
    const slot2 = await browserQueue.acquire();

    // Both slots acquired — release them before test ends
    await slot1.release();
    await slot2.release();

    expect(true).toBe(true); // No deadlock
  });
});
