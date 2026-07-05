const productService = require('../services/productService');

function searchProducts(req, res) {
  const search = req.query.q || '';
  const products = productService.searchProducts(search);
  const totalStores = new Set(products.map((product) => product.store)).size;

  res.json({
    success: true,
    search,
    totalStores,
    products
  });
}

function compareProducts(req, res) {
  const search = req.query.q || '';
  const products = productService.compareProducts(search);
  const totalStores = new Set(products.map((product) => product.store)).size;

  res.json({
    success: true,
    search,
    totalStores,
    products
  });
}

function getProductDetails(req, res, next) {
  const product = productService.getProductById(req.params.id);

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    return next(error);
  }

  return res.json({
    success: true,
    product
  });
}

module.exports = {
  searchProducts,
  compareProducts,
  getProductDetails
};
