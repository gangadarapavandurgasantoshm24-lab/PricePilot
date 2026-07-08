/**
 * @module browserManager
 * @description Singleton browser lifecycle manager for Playwright.
 *
 * Responsibilities:
 *  - Lazy-load Playwright (only when first page is actually needed)
 *  - Maintain a single shared browser instance
 *  - Create and track browser contexts
 *  - Create and track pages
 *  - Shutdown gracefully (SIGTERM / process.exit)
 *  - Report live metrics (activeBrowsers, activeContexts, activePages, uptime)
 *
 * Graceful degradation:
 *  If Playwright is not installed (no browser binaries), getMetrics() returns
 *  { available: false } and all launch attempts log a warning + throw.
 *
 * Architecture guarantee:
 *  Controllers and providers NEVER import playwright directly.
 *  All browser interactions go through this manager or browserQueue.js.
 */

const browserConfig = require('../config/browser');
const logger = require('../utils/logger');

// ─── State ────────────────────────────────────────────────────────────────────

/** @type {import('playwright').Browser | null} */
let _browser = null;

/** @type {Set<import('playwright').BrowserContext>} */
const _contexts = new Set();

/** @type {Set<import('playwright').Page>} */
const _pages = new Set();

let _launchedAt = null;
let _available = null; // null = not tested yet

// ─── Playwright availability ──────────────────────────────────────────────────

/**
 * Attempt to load the playwright module.
 * Returns null if playwright is not installed or browsers not downloaded.
 *
 * @returns {object|null} playwright module or null
 */
function tryLoadPlaywright() {
  try {
    // eslint-disable-next-line global-require
    return require('playwright');
  } catch (_) {
    return null;
  }
}

// ─── Browser lifecycle ────────────────────────────────────────────────────────

/**
 * Launch a Chromium browser if one is not already running.
 *
 * @returns {Promise<import('playwright').Browser>}
 * @throws {Error} if playwright is unavailable
 */
async function launch() {
  if (_browser && _browser.isConnected()) {
    return _browser;
  }

  const pw = tryLoadPlaywright();
  if (!pw) {
    _available = false;
    throw new Error(
      'Playwright is not available. Run: npx playwright install chromium'
    );
  }

  logger.info('Browser Launching', {
    headless: browserConfig.headless,
    slowMo: browserConfig.slowMo
  });

  _browser = await pw.chromium.launch({
    headless: browserConfig.headless,
    slowMo:   browserConfig.slowMo
  });

  _launchedAt = Date.now();
  _available = true;

  _browser.on('disconnected', () => {
    logger.warn('Browser Disconnected');
    _browser = null;
    _launchedAt = null;
    _contexts.clear();
    _pages.clear();
  });

  logger.info('Browser Launched');
  return _browser;
}

/**
 * Create a new browser context (isolated session: cookies, storage, etc.).
 *
 * @returns {Promise<import('playwright').BrowserContext>}
 */
async function createContext() {
  const browser = await launch();

  const context = await browser.newContext({
    viewport:           browserConfig.viewport,
    userAgent:          browserConfig.userAgent,
    ignoreHTTPSErrors:  false,
    javaScriptEnabled:  true
  });

  _contexts.add(context);

  context.on('close', () => _contexts.delete(context));

  logger.info('Browser Context Created', { activeContexts: _contexts.size });
  return context;
}

/**
 * Create a new page within an existing context.
 *
 * @param {import('playwright').BrowserContext} context
 * @returns {Promise<import('playwright').Page>}
 */
async function newPage(context) {
  const page = await context.newPage();

  page.setDefaultTimeout(browserConfig.timeout);
  page.setDefaultNavigationTimeout(browserConfig.timeout);

  _pages.add(page);

  page.on('close', () => _pages.delete(page));

  logger.info('Browser Page Created', { activePages: _pages.size });
  return page;
}

/**
 * Navigate a page to a URL and wait for it to settle.
 *
 * @param {import('playwright').Page} page
 * @param {string} url
 * @param {object} [options]
 * @param {string} [options.waitUntil='domcontentloaded'] - Playwright wait condition
 * @returns {Promise<void>}
 */
async function goto(page, url, { waitUntil = 'domcontentloaded' } = {}) {
  logger.info('Browser Navigation', { url });
  await page.goto(url, { waitUntil, timeout: browserConfig.timeout });
}

/**
 * Close a page and remove it from tracking.
 *
 * @param {import('playwright').Page} page
 * @returns {Promise<void>}
 */
async function closePage(page) {
  if (!page.isClosed()) {
    await page.close();
  }
  _pages.delete(page);
  logger.info('Browser Page Closed', { activePages: _pages.size });
}

/**
 * Close a context and all its pages.
 *
 * @param {import('playwright').BrowserContext} context
 * @returns {Promise<void>}
 */
async function closeContext(context) {
  await context.close();
  _contexts.delete(context);
  logger.info('Browser Context Closed', { activeContexts: _contexts.size });
}

/**
 * Gracefully close the browser and all contexts/pages.
 *
 * @returns {Promise<void>}
 */
async function shutdown() {
  if (!_browser) return;

  logger.info('Browser Shutting Down', {
    activeContexts: _contexts.size,
    activePages:    _pages.size
  });

  try {
    await _browser.close();
  } catch (error) {
    logger.warn('Browser Shutdown Error', { error: error.message });
  }

  _browser   = null;
  _launchedAt = null;
  _contexts.clear();
  _pages.clear();

  logger.info('Browser Shutdown Complete');
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

/**
 * Return live browser metrics.
 *
 * @returns {object} Metrics snapshot
 */
function getMetrics() {
  // If we have never tried loading playwright, probe now (synchronously)
  if (_available === null) {
    _available = tryLoadPlaywright() !== null;
  }

  return {
    available:       _available,
    activeBrowsers:  _browser && _browser.isConnected() ? 1 : 0,
    activeContexts:  _contexts.size,
    activePages:     _pages.size,
    uptimeMs:        _launchedAt ? Date.now() - _launchedAt : 0
  };
}

// ─── Graceful shutdown hooks ──────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  launch,
  createContext,
  newPage,
  goto,
  closePage,
  closeContext,
  shutdown,
  getMetrics
};
