/**
 * @module browser.routes
 * @description Routes for browser infrastructure metrics.
 *
 * GET /api/browser  – Live BrowserManager + BrowserQueue status
 */

const { Router } = require('express');
const { getBrowserStatus } = require('../controllers/browser.controller');

const router = Router();

/**
 * @route   GET /api/browser
 * @desc    Return live browser manager and queue metrics
 * @access  Public
 *
 * @returns {object} 200
 * {
 *   success: true,
 *   browser: { available, activeBrowsers, activeContexts, activePages, uptimeMs },
 *   queue:   { queueLength, activePages, maxPages }
 * }
 */
router.get('/browser', getBrowserStatus);

module.exports = router;
