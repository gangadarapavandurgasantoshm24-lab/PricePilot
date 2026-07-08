const express = require('express');
const searchController = require('../controllers/search.controller');

const router = express.Router();

router.get('/search', searchController.searchProducts);
router.get('/platforms', searchController.getSupportedPlatforms);
router.get('/platform/:platform', searchController.searchPlatform);

module.exports = router;
