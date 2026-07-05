const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/search', productController.searchProducts);
router.get('/compare', productController.compareProducts);
router.get('/products/:id', productController.getProductDetails);

module.exports = router;
