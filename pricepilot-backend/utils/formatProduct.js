const calculateFinalPrice = require('./calculateFinalPrice');

function formatProduct(product) {
  return {
    ...product,
    finalPayablePrice: calculateFinalPrice(product)
  };
}

function formatComparisonProduct(product) {
  return {
    id: product.id,
    store: product.store,
    title: product.title,
    brand: product.brand,
    productPrice: product.productPrice,
    gst: product.gst,
    shipping: product.shipping,
    bankOffer: product.bankOffer,
    couponDiscount: product.couponDiscount,
    finalPayablePrice: calculateFinalPrice(product),
    deliveryDays: product.deliveryDays,
    productURL: product.productURL
  };
}

module.exports = {
  formatProduct,
  formatComparisonProduct
};
