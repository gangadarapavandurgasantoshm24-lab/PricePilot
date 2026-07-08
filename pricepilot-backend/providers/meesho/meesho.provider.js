/**
 * Meesho Mock Provider
 * strategy: 'playwright' (fallback when Playwright unavailable)
 *
 * Returns realistic fashion/home/general product data for demonstration and testing.
 * All product data is for portfolio demonstration only.
 */

const { normalizeProduct } = require('../../services/normalization.service');
const { normalizeText }    = require('../../utils/helpers');

const MEESHO_PRODUCTS = [
  {
    id: 'm-001', title: 'Women Printed Flared Kurti',
    brand: 'Saara Fashion', category: 'Fashion Kurti Ethnic Wear Women',
    productPrice: 399, gst: 0, shipping: 0, bankOffer: 0, couponDiscount: 100,
    rating: 4.0, reviewCount: 5241,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.meesho.com/printed-kurti/p/abc123'
  },
  {
    id: 'm-002', title: "Men's Regular Fit Formal Shirt",
    brand: 'Park Avenue', category: 'Fashion Shirt Formal Men Clothing',
    productPrice: 549, gst: 0, shipping: 0, bankOffer: 0, couponDiscount: 150,
    rating: 4.1, reviewCount: 3187,
    image: 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.meesho.com/formal-shirt/p/def456'
  },
  {
    id: 'm-003', title: 'Stylish Canvas Sneakers Shoes',
    brand: 'Liberty', category: 'Fashion Shoes Sneakers Footwear',
    productPrice: 699, gst: 0, shipping: 50, bankOffer: 0, couponDiscount: 200,
    rating: 3.9, reviewCount: 8921,
    image: 'https://images.unsplash.com/photo-1607522370275-f6fd21555c2e?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.meesho.com/canvas-sneakers/p/ghi789'
  },
  {
    id: 'm-004', title: 'Designer Cotton Jeans for Men',
    brand: 'Highlander', category: 'Fashion Jeans Denim Men',
    productPrice: 799, gst: 0, shipping: 0, bankOffer: 0, couponDiscount: 250,
    rating: 4.2, reviewCount: 6450,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.meesho.com/denim-jeans/p/jkl012'
  },
  {
    id: 'm-005', title: 'Premium Storage Boxes Organizer Set of 3',
    brand: 'Kuber Industries', category: 'Home Storage Organizer Box',
    productPrice: 349, gst: 0, shipping: 0, bankOffer: 0, couponDiscount: 70,
    rating: 4.0, reviewCount: 2134,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.meesho.com/storage-boxes/p/mno345'
  },
  {
    id: 'm-006', title: 'Hand Block Print Dupatta',
    brand: 'Rajwadi Saree', category: 'Fashion Dupatta Ethnic Wear',
    productPrice: 249, gst: 0, shipping: 0, bankOffer: 0, couponDiscount: 50,
    rating: 4.3, reviewCount: 4312,
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.meesho.com/block-print-dupatta/p/pqr678'
  },
  {
    id: 'm-007', title: 'Non-Stick Cookware Set 5 Pieces',
    brand: 'Prestige', category: 'Home Kitchen Cookware Pan',
    productPrice: 1299, gst: 0, shipping: 0, bankOffer: 0, couponDiscount: 300,
    rating: 4.1, reviewCount: 3876,
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.meesho.com/cookware-set/p/stu901'
  },
  {
    id: 'm-008', title: "Women's Running Sports Shoes",
    brand: 'Furo', category: 'Fashion Shoes Sports Running Footwear',
    productPrice: 599, gst: 0, shipping: 0, bankOffer: 0, couponDiscount: 150,
    rating: 3.8, reviewCount: 7234,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.meesho.com/running-shoes/p/vwx234'
  },
  {
    id: 'm-009', title: 'Cotton Blend Hooded Sweatshirt',
    brand: 'Campus Sutra', category: 'Fashion Sweatshirt Hoodie Winter',
    productPrice: 799, gst: 0, shipping: 0, bankOffer: 0, couponDiscount: 200,
    rating: 4.2, reviewCount: 2891,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.meesho.com/cotton-hoodie/p/yza567'
  },
  {
    id: 'm-010', title: 'Floral Print Summer Dress',
    brand: 'FabAlley', category: 'Fashion Dress Summer Wear Women',
    productPrice: 899, gst: 0, shipping: 0, bankOffer: 0, couponDiscount: 250,
    rating: 4.0, reviewCount: 1654,
    image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.meesho.com/floral-dress/p/bcd890'
  }
];

function productMatchesQuery(product, query) {
  const q = normalizeText(query);
  const searchText = normalizeText([product.title, product.brand, product.category].join(' '));
  return q.split(/\s+/).filter(Boolean).every(term => searchText.includes(term));
}

module.exports = {
  platform: 'meesho',
  source: 'mock',

  async searchProducts(query) {
    return MEESHO_PRODUCTS
      .filter(p => productMatchesQuery(p, query))
      .map(p => normalizeProduct({ ...p, store: 'Meesho' }, 'meesho', 'mock'));
  }
};
