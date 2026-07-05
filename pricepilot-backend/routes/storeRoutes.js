const express = require('express');
const storeController = require('../controllers/storeController');

const router = express.Router();

router.get('/stores', storeController.getStores);

module.exports = router;
