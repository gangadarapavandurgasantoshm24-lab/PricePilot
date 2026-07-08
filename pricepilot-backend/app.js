/**
 * @module app
 * @description Express application factory for PricePilot backend.
 *
 * Route groups:
 *   /api/health      – server liveness check
 *   /api/search      – product search across all providers
 *   /api/platform/:p – single-platform search
 *   /api/platforms   – supported platform list
 *   /api/providers   – provider health dashboard   (Week 4 – Step 3)
 *   /api/analytics   – search analytics summary    (Week 4 – Step 7)
 *   /api/history     – recent search history       (Week 4 – Step 8)
 *   /api/browser     – browser manager metrics     (Week 5 – Step 8)
 *   /api/compare     – product comparison
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes  = require('./routes/productRoutes');
const storeRoutes    = require('./routes/storeRoutes');
const healthRoutes   = require('./routes/healthRoutes');
const searchRoutes   = require('./routes/search.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const providerRoutes = require('./routes/provider.routes');
const browserRoutes  = require('./routes/browser.routes');
const logger         = require('./middleware/logger');
const notFound       = require('./middleware/notFound');
const errorHandler   = require('./middleware/errorHandler');

const app = express();

// ─── Global middleware ────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(logger);

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api', healthRoutes);
app.use('/api', searchRoutes);
app.use('/api', productRoutes);
app.use('/api', storeRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', providerRoutes);
app.use('/api', browserRoutes);

// ─── Static frontend ─────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, '..', 'pricepilot-frontend')));

// ─── Error handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

module.exports = app;
