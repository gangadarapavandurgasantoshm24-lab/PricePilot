function isValidUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

function isValidProduct(product) {
  return Boolean(
    product &&
    product.productName &&
    Number(product.currentPrice) > 0 &&
    product.image &&
    isValidUrl(product.image) &&
    product.productUrl &&
    isValidUrl(product.productUrl)
  );
}

module.exports = {
  isValidProduct,
  isValidUrl
};
