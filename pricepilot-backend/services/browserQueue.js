/**
 * @module browserQueue
 * @description Concurrency-limited queue for Playwright page access.
 *
 * Prevents opening more than `maxPages` simultaneous pages, which
 * protects memory and avoids detection by rate-limiting on target sites.
 *
 * Usage:
 *   const slot = await browserQueue.acquire();
 *   try {
 *     await browserManager.goto(slot.page, url);
 *     const data = await slot.page.evaluate(...);
 *   } finally {
 *     await slot.release();
 *   }
 *
 * Architecture guarantee:
 *   Playwright providers NEVER manage their own browser instances.
 *   They always acquire a slot from this queue.
 */

const browserManager = require('./browserManager');
const browserConfig  = require('../config/browser');
const logger         = require('../utils/logger');

// ─── Queue state ──────────────────────────────────────────────────────────────

/**
 * Pending acquire callbacks waiting for a free slot.
 * @type {Array<{ resolve: Function, reject: Function, addedAt: number }>}
 */
const _waiters = [];

/** Number of currently active (open) pages managed by this queue. */
let _activePages = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Drain the queue: resolve the next waiter if a slot is available. */
async function _drain() {
  if (_activePages >= browserConfig.maxPages || _waiters.length === 0) {
    return;
  }

  const waiter = _waiters.shift();

  // Check if this waiter has already timed out
  if (Date.now() - waiter.addedAt >= browserConfig.queueTimeout) {
    waiter.reject(new Error(
      `BrowserQueue: timed out waiting for a free page slot after ${browserConfig.queueTimeout}ms`
    ));
    // Try to drain again for the next waiter
    _drain();
    return;
  }

  _activePages += 1;
  logger.info('Browser Slot Acquired', {
    activePages: _activePages,
    maxPages:    browserConfig.maxPages,
    queueLength: _waiters.length
  });

  try {
    const context = await browserManager.createContext();
    const page    = await browserManager.newPage(context);

    waiter.resolve({
      page,
      release: async () => {
        // Always decrement and drain – even if close calls throw
        try {
          await browserManager.closePage(page);
        } catch (err) {
          logger.warn('Browser Slot: closePage Error (ignored)', { error: err.message });
        }
        try {
          await browserManager.closeContext(context);
        } catch (err) {
          logger.warn('Browser Slot: closeContext Error (ignored)', { error: err.message });
        }
        _activePages = Math.max(0, _activePages - 1);
        logger.info('Browser Slot Released', {
          activePages: _activePages,
          queueLength: _waiters.length
        });
        _drain();
      }
    });
  } catch (error) {
    _activePages = Math.max(0, _activePages - 1);
    waiter.reject(error);
    _drain();
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Acquire a browser page slot. Waits if the maximum is already reached.
 *
 * @returns {Promise<{ page: import('playwright').Page, release: Function }>}
 */
function acquire() {
  return new Promise((resolve, reject) => {
    _waiters.push({ resolve, reject, addedAt: Date.now() });
    _drain();
  });
}

/**
 * Return live queue metrics.
 *
 * @returns {{ queueLength: number, activePages: number, maxPages: number }}
 */
function getMetrics() {
  return {
    queueLength: _waiters.length,
    activePages:  _activePages,
    maxPages:     browserConfig.maxPages
  };
}

module.exports = { acquire, getMetrics };
