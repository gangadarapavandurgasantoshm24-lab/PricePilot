module.exports = {
  baseUrl: 'https://www.zeptonow.com',
  searchUrl: (query) => `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`,
  resultItem: '[class*="Product"], [class*="product"]:has(a[href]), a[href*="/pn/"]',
  brand: '[class*="brand"], [class*="Brand"]',
  title: '[class*="name"], [class*="Name"], h3, h2, a[href*="/pn/"]',
  price: '[class*="price"], [class*="Price"], [class*="selling"]',
  originalPrice: 'del, [class*="mrp"], [class*="MRP"], [class*="strike"]',
  discount: '[class*="discount"], [class*="off"]',
  rating: '[class*="rating"], [aria-label*="rating"]',
  reviewCount: '[class*="review"]',
  image: 'img',
  link: 'a[href*="/pn/"], a[href]',
  delivery: '[class*="delivery"], [class*="time"], [class*="eta"]',
  offer: '[class*="offer"], [class*="coupon"], [class*="discount"]',
  outOfStock: '[class*="out-of-stock"], [class*="sold"], [class*="unavailable"]',
  waitFor: 'a[href], [class*="Product"], [class*="product"]'
};
