/**
 * @module analyticsRoutes
 * @description Express router for analytics and search history endpoints.
 *
 * Registered endpoints:
 *   GET /api/analytics  – aggregated search metrics
 *   GET /api/history    – recent search history
 */

const express = require('express');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/analytics', analyticsController.getAnalytics);
router.get('/history', analyticsController.getHistory);

module.exports = router;
