/**
 * @module providerController
 * @description Handles GET /api/providers – provider health dashboard.
 */

const providerRegistry = require('../services/providerRegistry');

/**
 * GET /api/providers
 * Return health and configuration for every registered provider.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getProviders(req, res) {
  const report = providerRegistry.getHealthReport();

  const healthy = report.filter((p) => p.status === 'Healthy').length;
  const degraded = report.filter((p) => p.status === 'Degraded').length;
  const unhealthy = report.filter((p) => p.status === 'Unhealthy' || p.status === 'Disabled').length;

  return res.json({
    success: true,
    summary: {
      total: report.length,
      healthy,
      degraded,
      unhealthy
    },
    providers: report
  });
}

module.exports = {
  getProviders
};
