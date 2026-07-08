/**
 * @module browser.controller
 * @description Controller for browser metrics endpoint.
 *
 * GET /api/browser
 *  Returns live BrowserManager and BrowserQueue metrics.
 *  Does NOT launch a browser — purely a status check.
 */

const browserManager = require('../services/browserManager');
const browserQueue   = require('../services/browserQueue');

/**
 * GET /api/browser
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
function getBrowserStatus(req, res) {
  const managerMetrics = browserManager.getMetrics();
  const queueMetrics   = browserQueue.getMetrics();

  res.json({
    success: true,
    browser: managerMetrics,
    queue:   queueMetrics
  });
}

module.exports = { getBrowserStatus };
