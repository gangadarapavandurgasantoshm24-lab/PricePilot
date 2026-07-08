const { calculateFinalPrice } = require('./pricing.service');
const { safeNumber } = require('../utils/helpers');

function calculateDiscountPercentage(currentPrice, originalPrice) {
  if (!originalPrice || originalPrice <= currentPrice) {
    return 0;
  }

  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

function normalizeProduct(rawProduct, platform, source = 'api') {
  const listingPrice = safeNumber(
    rawProduct.currentPrice ||
    rawProduct.price ||
    rawProduct.productPrice ||
    calculateFinalPrice(rawProduct)
  );

  const gst = safeNumber(rawProduct.gst);
  const shipping = safeNumber(rawProduct.shipping);
  const bankOffer = safeNumber(rawProduct.bankOffer);
  const couponDiscount = safeNumber(rawProduct.couponDiscount);
  const finalPayablePrice = safeNumber(
    rawProduct.finalPayablePrice,
    Math.max(0, listingPrice + gst + shipping - bankOffer - couponDiscount)
  );
  const totalSavings = bankOffer + couponDiscount;

  const originalPrice = safeNumber(
    rawProduct.originalPrice ||
    rawProduct.mrp ||
    rawProduct.productPrice ||
    listingPrice
  );

  return {
    platform,
    productId: String(rawProduct.productId || rawProduct.id || `${platform}-${rawProduct.title || rawProduct.name || Date.now()}`),
    productName: rawProduct.productName || rawProduct.title || rawProduct.name || '',
    brand: rawProduct.brand || '',
    category: rawProduct.category || '',
    description: rawProduct.description || `${rawProduct.brand || platform} ${rawProduct.title || rawProduct.productName || ''}`.trim(),
    currentPrice: listingPrice,
    originalPrice,
    gst,
    shipping,
    bankOffer,
    couponDiscount,
    totalSavings,
    finalPayablePrice,
    discountPercentage: safeNumber(
      rawProduct.discountPercentage ||
      rawProduct.discount ||
      (listingPrice ? Math.round((totalSavings / listingPrice) * 100) : calculateDiscountPercentage(listingPrice, originalPrice))
    ),
    rating: safeNumber(rawProduct.rating, 4.2),
    reviewCount: safeNumber(rawProduct.reviewCount || rawProduct.reviews, 120),
    image: rawProduct.image || rawProduct.imageUrl || '',
    productUrl: rawProduct.productUrl || rawProduct.productURL || rawProduct.url || '',
    availability: rawProduct.availability !== false,
    source,
    fetchedAt: new Date().toISOString()
  };
}

module.exports = {
  normalizeProduct
};
