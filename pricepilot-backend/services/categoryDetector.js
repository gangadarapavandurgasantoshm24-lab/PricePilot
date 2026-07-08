/**
 * @module categoryDetector
 * @description Detects the product category from a user search query.
 *
 * Uses keyword matching — no ML required.
 * Returns one of: 'electronics', 'fashion', 'beauty', 'medicine', 'home',
 *                 'groceries', 'general'
 *
 * Category check order matters — more specific / longer keywords first.
 * Avoid single-character or 2-character keywords; they cause false positives
 * (e.g. 'ac' would match the word 'face').
 *
 * Architecture guarantee:
 *   Category detection is isolated here. Platform Manager, controllers,
 *   and providers never run keyword matching themselves.
 */

/**
 * Category keyword map.
 * IMPORTANT: Order of categories matters — checked top-to-bottom.
 *            More specific categories should appear before general ones.
 *            Keep all keywords at least 4 characters to avoid false positives.
 */
const CATEGORY_KEYWORDS = {
  // Beauty checked BEFORE medicine to prevent 'serum' / 'vitamin c serum' mismatches
  beauty: [
    'lipstick', 'lip gloss', 'lip liner', 'lip balm',
    'foundation', 'concealer', 'primer', 'blush', 'highlighter', 'bronzer',
    'eyeshadow', 'mascara', 'eyeliner', 'kajal', 'eye pencil',
    'nail polish', 'nail art',
    'serum', 'moisturizer', 'sunscreen', 'toner', 'face wash', 'facewash',
    'cleanser', 'scrub', 'face mask', 'sheet mask', 'peel off',
    'fairness cream', 'night cream', 'day cream', 'eye cream', 'anti aging',
    'shampoo', 'conditioner', 'hair oil', 'hair mask', 'hair serum',
    'hair color', 'hair dye', 'henna',
    'perfume', 'deodorant', 'body mist', 'fragrance', 'cologne', 'eau de toilette',
    'body lotion', 'body wash', 'shower gel', 'bath soap',
    'makeup', 'cosmetics', 'beauty kit', 'compact', 'setting spray',
    'bb cream', 'cc cream', 'skin care', 'skincare', 'hair care', 'haircare',
    'micellar', 'retinol', 'niacinamide', 'vitamin c serum', 'hyaluronic',
    'collagen', 'salicylic', 'benzoyl', 'spf'
  ],

  medicine: [
    'paracetamol', 'ibuprofen', 'antibiotic', 'capsule', 'syrup',
    'medicine', 'drug', 'pharmacy', 'multivitamin', 'vitamin supplement',
    'vitamin tablet', 'vitamin capsule', 'protein powder', 'whey protein',
    'probiotic', 'insulin', 'inhaler', 'ointment', 'antiseptic',
    'bandage', 'thermometer', 'glucometer', 'blood pressure monitor',
    'pulse oximeter', 'nebulizer', 'dolo', 'crocin', 'azithromycin',
    'cetirizine', 'omeprazole', 'pantoprazole',
    // 'tablet' kept but checked after beauty to avoid 'vitamin tablet' confusion
    'tablet medicine', 'medicine tablet',
    // Common OTC brand triggers
    'health supplement', 'dietary supplement', 'immunity booster',
    'zinc supplement', 'omega 3', 'fish oil', 'calcium supplement'
  ],

  electronics: [
    'iphone', 'smartphone', 'samsung phone', 'oneplus', 'pixel phone',
    'redmi', 'realme', 'oppo', 'vivo', 'motorola',
    'laptop', 'notebook', 'macbook', 'chromebook', 'dell laptop',
    'television', 'led tv', 'oled', 'qled', 'smart tv',
    'earphone', 'earbuds', 'headphone', 'headset', 'bluetooth earphones',
    'speaker', 'soundbar', 'home theatre',
    'dslr', 'mirrorless camera', 'action camera', 'gopro',
    'ipad', 'kindle', 'fire tablet',
    'smartwatch', 'fitness band', 'wearable',
    'power bank', 'charger', 'data cable', 'wifi router',
    'monitor', 'keyboard', 'webcam', 'hard disk', 'solid state drive',
    'refrigerator', 'washing machine', 'microwave oven', 'air conditioner',
    'gaming console', 'playstation', 'xbox', 'nintendo',
    'graphics card', 'processor', 'drone', 'projector', 'printer',
    'electric trimmer', 'electric shaver',
    // Short but unambiguous electronics terms
    'phone', 'laptop', 'camera', 'tablet', 'speaker', 'router',
    'bluetooth', 'wifi', 'hdmi', 'usb', 'samsung', 'nokia', 'earbuds',
    'television', 'tv'
  ],

  fashion: [
    'shirt', 'tshirt', 't-shirt', 'polo shirt', 'kurta', 'kurti',
    'jeans', 'trouser', 'chinos', 'joggers', 'track pant', 'shorts',
    'dress', 'gown', 'lehenga', 'saree', 'salwar', 'ethnic wear',
    'jacket', 'blazer', 'overcoat', 'hoodie', 'sweatshirt', 'sweater', 'cardigan',
    'sneakers', 'heels', 'sandals', 'slippers', 'boots', 'loafers',
    'footwear', 'flip flops', 'sports shoes', 'running shoes', 'formal shoes',
    'handbag', 'backpack', 'tote bag', 'sling bag', 'clutch', 'wallet',
    'jewellery', 'earring', 'necklace', 'bracelet', 'bangle',
    'sunglasses', 'fashion belt', 'scarf', 'cap', 'beanie',
    'lingerie', 'innerwear', 'socks', 'suit', 'sherwani', 'dhoti',
    'leggings', 'track suit', 'denim', 'ethnic', 'apparel', 'outfit',
    'swimwear', 'kids wear', 'baby clothes', 'fashion', 'clothing',
    // common short fashion terms safe from ambiguity
    'shoes', 'bag', 'dress', 'jeans', 'kurta', 'saree'
  ],

  home: [
    'sofa', 'mattress', 'pillow', 'bedsheet', 'blanket', 'comforter',
    'dining table', 'study desk', 'wardrobe', 'bookshelf',
    'ceiling lamp', 'table lamp', 'led bulb', 'chandelier',
    'curtain', 'blinds', 'carpet', 'doormat',
    'pressure cooker', 'non stick pan', 'kadai', 'cookware',
    'dinner plate', 'serving bowl', 'water bottle', 'thermos flask',
    'kitchen knife', 'chopping board',
    'mixer grinder', 'juicer', 'blender', 'food processor',
    'bread toaster', 'electric kettle',
    'storage box', 'organizer', 'airtight container',
    'bath towel', 'shower curtain',
    'wall art', 'photo frame', 'wall clock',
    'floor cleaner', 'vacuum cleaner', 'mop', 'broom',
    'water purifier', 'air purifier', 'humidifier',
    'home decor', 'furniture', 'garden', 'plant pot',
    // short but clear home terms
    'sofa', 'bed', 'table', 'chair', 'lamp', 'cookware', 'utensil'
  ],

  groceries: [
    'basmati rice', 'brown rice', 'toor dal', 'chana dal', 'whole wheat atta',
    'refined flour', 'besan flour', 'refined sugar', 'rock salt',
    'sunflower oil', 'mustard oil', 'pure ghee', 'amul butter',
    'full cream milk', 'hung curd', 'greek yogurt', 'fresh paneer',
    'digestive biscuit', 'potato chips', 'masala namkeen', 'microwave popcorn',
    'instant noodles', 'whole wheat pasta', 'sliced bread',
    'masala tea', 'instant coffee', 'green tea bags', 'cold pressed juice',
    'garam masala', 'turmeric powder', 'red chilli powder', 'cumin seeds',
    'frozen vegetables', 'ready to eat meal',
    'grocery', 'groceries', 'ration', 'pantry'
  ]
};

/**
 * Detect category from search query using keyword matching.
 *
 * @param {string} query - User search query
 * @returns {string} Category name
 */
function detectCategory(query) {
  if (!query || typeof query !== 'string') return 'general';

  const normalised = query.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalised.includes(keyword)) {
        return category;
      }
    }
  }

  return 'general';
}

/**
 * Get a human-readable display label for a category.
 *
 * @param {string} category
 * @returns {string}
 */
function getCategoryLabel(category) {
  const labels = {
    electronics: '📱 Electronics',
    fashion:     '👗 Fashion',
    beauty:      '💄 Beauty',
    medicine:    '💊 Medicine',
    home:        '🏠 Home',
    groceries:   '🛒 Groceries',
    general:     '🔍 All Categories'
  };
  return labels[category] || '🔍 All Categories';
}

module.exports = { detectCategory, getCategoryLabel, CATEGORY_KEYWORDS };
