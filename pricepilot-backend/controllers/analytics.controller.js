/**
 * @module analyticsController
 * @description Handles GET /api/analytics and GET /api/history endpoints.
 */

const analyticsService = require('../services/analytics.service');
const { numberEnv } = require('../config/env');

const DEFAULT_HISTORY_LIMIT = numberEnv('HISTORY_MAX_ENTRIES', 100);

/**
 * GET /api/analytics
 * Return aggregated search analytics.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getAnalytics(req, res) {
  const summary = analyticsService.getSummary();

  return res.json({
    success: true,
    analytics: summary
  });
}

/**
 * GET /api/history
 * Return recent search history.
 *
 * Query params:
 *   limit {number} – max entries to return (default 50, max DEFAULT_HISTORY_LIMIT)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getHistory(req, res) {
  const limit = Math.min(
    Number(req.query.limit) || 50,
    DEFAULT_HISTORY_LIMIT
  );

  const history = analyticsService.getHistory(limit);

  return res.json({
    success: true,
    count: history.length,
    history
  });
}

module.exports = {
  getAnalytics,
  getHistory
};
