function calculateFinalPrice(product) {
  return (
    product.productPrice +
    product.gst +
    product.shipping -
    product.bankOffer -
    product.couponDiscount
  );
}

module.exports = calculateFinalPrice;
