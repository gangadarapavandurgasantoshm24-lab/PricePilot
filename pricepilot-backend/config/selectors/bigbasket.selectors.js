module.exports = {
  baseUrl: 'https://www.bigbasket.com',
  searchUrl: (query) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`,
  resultItem: '[qa="product"], [class*="ProductCard"], [class*="product"]:has(a[href])',
  brand: '[class*="Brand"], [qa="product-brand"]',
  title: '[qa="product-name"], h3, h2, a[href*="/pd/"]',
  price: '[qa="product-price"], [class*="Price"], [class*="price"]',
  originalPrice: '[class*="MRP"], [class*="strike"], del',
  discount: '[class*="discount"], [class*="off"]',
  rating: '[class*="rating"], [aria-label*="rating"]',
  reviewCount: '[class*="review"]',
  image: 'img',
  link: 'a[href*="/pd/"], a[href]',
  delivery: '[class*="delivery"], [class*="slot"]',
  offer: '[class*="offer"], [class*="coupon"], [class*="discount"]',
  outOfStock: '[class*="out-of-stock"], [class*="sold"]',
  waitFor: 'a[href], [class*="product"], [qa="product"]'
};
