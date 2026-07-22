module.exports = {
  baseUrl: 'https://blinkit.com',
  searchUrl: (query) => `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
  resultItem: '[class*="Product"], [class*="product"]:has(a[href]), a[href*="/prn/"]',
  brand: '[class*="brand"], [class*="Brand"]',
  title: '[class*="Product__Name"], [class*="name"], h3, h2, a[href*="/prn/"]',
  price: '[class*="price"], [class*="Price"], [class*="selling"]',
  originalPrice: 'del, [class*="mrp"], [class*="MRP"], [class*="strike"]',
  discount: '[class*="discount"], [class*="off"]',
  rating: '[class*="rating"], [aria-label*="rating"]',
  reviewCount: '[class*="review"]',
  image: 'img',
  link: 'a[href*="/prn/"], a[href]',
  delivery: '[class*="delivery"], [class*="time"], [class*="eta"]',
  offer: '[class*="offer"], [class*="coupon"], [class*="discount"]',
  outOfStock: '[class*="out-of-stock"], [class*="sold"], [class*="unavailable"]',
  waitFor: 'a[href], [class*="Product"], [class*="product"]'
};
