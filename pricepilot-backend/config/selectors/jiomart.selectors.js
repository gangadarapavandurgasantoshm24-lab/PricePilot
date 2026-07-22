module.exports = {
  baseUrl: 'https://www.jiomart.com',
  searchUrl: (query) => `https://www.jiomart.com/search/${encodeURIComponent(query)}`,
  resultItem: '[class*="plp-card"], [class*="product-card"], [class*="ProductCard"], a[href*="/p/"]',
  brand: '[class*="brand"], [class*="Brand"]',
  title: '[class*="name"], [class*="Name"], h3, h2, a[href*="/p/"]',
  price: '[class*="price"], [class*="Price"], [class*="selling"]',
  originalPrice: 'del, [class*="mrp"], [class*="MRP"], [class*="strike"]',
  discount: '[class*="discount"], [class*="off"]',
  rating: '[class*="rating"], [aria-label*="rating"]',
  reviewCount: '[class*="review"]',
  image: 'img',
  link: 'a[href*="/p/"], a[href]',
  delivery: '[class*="delivery"], [class*="time"], [class*="eta"]',
  offer: '[class*="offer"], [class*="coupon"], [class*="discount"]',
  outOfStock: '[class*="out-of-stock"], [class*="sold"], [class*="unavailable"]',
  waitFor: 'a[href], [class*="plp-card"], [class*="product"]'
};
