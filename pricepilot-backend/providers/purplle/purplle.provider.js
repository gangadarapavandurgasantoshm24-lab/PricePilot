/**
 * Purplle Mock Provider
 * strategy: 'playwright' (fallback when Playwright unavailable)
 *
 * Returns realistic beauty product data for demonstration and testing.
 * All product data is for portfolio demonstration only.
 */

const { normalizeProduct } = require('../../services/normalization.service');
const { normalizeText }    = require('../../utils/helpers');

const PURPLLE_PRODUCTS = [
  {
    id: 'p-001', title: 'Lakme 9to5 Naturale Aloe Aqua Gel Foundation',
    brand: 'Lakme', category: 'Beauty Foundation Makeup',
    productPrice: 545, gst: 0, shipping: 0, bankOffer: 50, couponDiscount: 100,
    rating: 4.1, reviewCount: 2341,
    image: 'https://images.unsplash.com/photo-1631730358968-4dab43fd4e2f?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.purplle.com/product/lakme-9to5-naturale-aloe-aqua-gel-foundation'
  },
  {
    id: 'p-002', title: 'Maybelline New York Colossal Kajal',
    brand: 'Maybelline', category: 'Beauty Kajal Eyes Cosmetics Makeup',
    productPrice: 189, gst: 0, shipping: 0, bankOffer: 15, couponDiscount: 40,
    rating: 4.4, reviewCount: 9812,
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.purplle.com/product/maybelline-colossal-kajal'
  },
  {
    id: 'p-003', title: 'Biotique Bio Papaya Revitalizing Tan Removal Scrub',
    brand: 'Biotique', category: 'Beauty Scrub Skincare Face Wash',
    productPrice: 199, gst: 0, shipping: 49, bankOffer: 0, couponDiscount: 30,
    rating: 4.0, reviewCount: 3157,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.purplle.com/product/biotique-bio-papaya-scrub'
  },
  {
    id: 'p-004', title: "L'Oreal Paris Elvive Extraordinary Oil Shampoo",
    brand: "L'Oreal Paris", category: 'Beauty Shampoo Hair Care',
    productPrice: 375, gst: 0, shipping: 0, bankOffer: 30, couponDiscount: 75,
    rating: 4.2, reviewCount: 5420,
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.purplle.com/product/loreal-paris-elvive-shampoo'
  },
  {
    id: 'p-005', title: 'Sugar Cosmetics Matte Attack Transferproof Lipstick',
    brand: 'Sugar Cosmetics', category: 'Beauty Lipstick Makeup Cosmetics',
    productPrice: 499, gst: 0, shipping: 0, bankOffer: 50, couponDiscount: 100,
    rating: 4.3, reviewCount: 4128,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.purplle.com/product/sugar-matte-attack-lipstick'
  },
  {
    id: 'p-006', title: 'Dot & Key Watermelon Hyaluronic Hydrating Face Serum',
    brand: 'Dot & Key', category: 'Beauty Serum Skincare Hyaluronic',
    productPrice: 595, gst: 0, shipping: 0, bankOffer: 60, couponDiscount: 0,
    rating: 4.5, reviewCount: 2789,
    image: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.purplle.com/product/dot-key-watermelon-serum'
  },
  {
    id: 'p-007', title: 'Neutrogena Deep Moisture Body Lotion',
    brand: 'Neutrogena', category: 'Beauty Body Lotion Skincare Moisturizer',
    productPrice: 449, gst: 0, shipping: 0, bankOffer: 45, couponDiscount: 89,
    rating: 4.3, reviewCount: 3612,
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.purplle.com/product/neutrogena-deep-moisture-lotion'
  },
  {
    id: 'p-008', title: 'Plum Green Tea Renewed Clarity Night Gel',
    brand: 'Plum', category: 'Beauty Night Cream Skincare Gel',
    productPrice: 675, gst: 0, shipping: 0, bankOffer: 70, couponDiscount: 135,
    rating: 4.4, reviewCount: 1983,
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?auto=format&fit=crop&w=500&q=80',
    productURL: 'https://www.purplle.com/product/plum-green-tea-night-gel'
  }
];

function productMatchesQuery(product, query) {
  const q = normalizeText(query);
  const searchText = normalizeText([product.title, product.brand, product.category].join(' '));
  return q.split(/\s+/).filter(Boolean).every(term => searchText.includes(term));
}

module.exports = {
  platform: 'purplle',
  source: 'mock',

  async searchProducts(query) {
    return PURPLLE_PRODUCTS
      .filter(p => productMatchesQuery(p, query))
      .map(p => normalizeProduct({ ...p, store: 'Purplle' }, 'purplle', 'mock'));
  }
};
