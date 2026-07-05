const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const storeRoutes = require('./routes/storeRoutes');
const healthRoutes = require('./routes/healthRoutes');
const logger = require('./middleware/logger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.use('/api', healthRoutes);
app.use('/api', productRoutes);
app.use('/api', storeRoutes);

app.use(express.static(path.join(__dirname, '..', 'pricepilot-frontend')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
