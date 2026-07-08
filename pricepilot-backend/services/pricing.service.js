const { safeNumber } = require('../utils/helpers');

function calculateFinalPrice(product) {
  const currentPrice = safeNumber(product.currentPrice || product.price || product.productPrice);
  const gst = safeNumber(product.gst);
  const shipping = safeNumber(product.shipping);
  const bankOffer = safeNumber(product.bankOffer);
  const couponDiscount = safeNumber(product.couponDiscount);
  const cashback = safeNumber(product.cashback);
  const walletOffer = safeNumber(product.walletOffer);
  const exchangeBonus = safeNumber(product.exchangeBonus);
  const emiDiscount = safeNumber(product.emiDiscount);

  return Math.max(
    0,
    currentPrice +
      gst +
      shipping -
      bankOffer -
      couponDiscount -
      cashback -
      walletOffer -
      exchangeBonus -
      emiDiscount
  );
}

module.exports = {
  calculateFinalPrice
};
