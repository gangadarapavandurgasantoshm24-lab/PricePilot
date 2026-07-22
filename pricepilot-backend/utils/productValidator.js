const logger = require('./logger');
const { isValidUrl } = require('./validators');

function validateProduct(product, seenIds = new Set()) {
  const errors = [];

  if (!product || typeof product !== 'object') errors.push('Product is required');
  if (!product.productName) errors.push('Missing title');
  if (!product.productUrl || !isValidUrl(product.productUrl)) errors.push('Missing URL');
  if (Number(product.currentPrice) <= 0) errors.push('Invalid price');
  if (product.image && !isValidUrl(product.image)) errors.push('Invalid image URL');
  if (product.rating !== undefined && (Number(product.rating) < 0 || Number(product.rating) > 5)) errors.push('Invalid rating');
  if (product.productId && seenIds.has(product.productId)) errors.push('Duplicate ID');

  if (errors.length) {
    logger.warn('Validation Failure', {
      productId: product && product.productId,
      productName: product && product.productName,
      errors
    });
  } else if (product.productId) {
    seenIds.add(product.productId);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function filterValidProducts(products) {
  const seenIds = new Set();
  return products.filter((product) => validateProduct(product, seenIds).valid);
}

function validateProductsWithDetails(products) {
  const seenIds = new Set();
  const validProducts = [];
  const rejected = [];

  (Array.isArray(products) ? products : []).forEach((product) => {
    const result = validateProduct(product, seenIds);
    if (result.valid) {
      validProducts.push(product);
    } else {
      rejected.push({
        productId: product && product.productId,
        productName: product && product.productName,
        platform: product && product.platform,
        errors: result.errors
      });
    }
  });

  return {
    validProducts,
    rejected,
    rejectedCount: rejected.length,
    rejectionReasons: rejected.reduce((acc, item) => {
      item.errors.forEach((error) => {
        acc[error] = (acc[error] || 0) + 1;
      });
      return acc;
    }, {})
  };
}

module.exports = {
  validateProduct,
  filterValidProducts,
  validateProductsWithDetails
};
