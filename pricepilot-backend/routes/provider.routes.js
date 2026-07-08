/**
 * @module providerRoutes
 * @description Express router for provider health endpoint.
 *
 * Registered endpoints:
 *   GET /api/providers  – health status for all registered providers
 */

const express = require('express');
const providerController = require('../controllers/provider.controller');

const router = express.Router();

router.get('/providers', providerController.getProviders);

module.exports = router;
