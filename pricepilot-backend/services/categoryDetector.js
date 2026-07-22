/**
 * @module categoryDetector
 * @description Detects the product category from a user search query.
 *
 * Phase 2 upgrades:
 *  - Expanded keyword lists for all categories
 *  - More brand signals
 *  - More product types for subtype detection
 *  - More synonym corrections (spelling mistakes, abbreviations)
 *  - Improved confidence calculation
 *
 * Returns one of: 'electronics', 'fashion', 'beauty', 'medicine', 'home',
 *                 'groceries', 'general'
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
    'lipstick', 'lip gloss', 'lip liner', 'lip balm', 'lip tint', 'lip care',
    'foundation', 'concealer', 'primer', 'blush', 'highlighter', 'bronzer',
    'eyeshadow', 'mascara', 'eyeliner', 'kajal', 'eye pencil', 'kohl',
    'nail polish', 'nail art', 'nail paint', 'nail color',
    'serum', 'moisturizer', 'sunscreen', 'toner', 'face wash', 'facewash',
    'cleanser', 'scrub', 'face mask', 'sheet mask', 'peel off', 'face pack',
    'fairness cream', 'night cream', 'day cream', 'eye cream', 'anti aging',
    'shampoo', 'conditioner', 'hair oil', 'hair mask', 'hair serum',
    'hair color', 'hair dye', 'henna', 'hair fall', 'dandruff shampoo',
    'perfume', 'deodorant', 'body mist', 'fragrance', 'cologne', 'eau de toilette',
    'body lotion', 'body wash', 'shower gel', 'bath soap', 'hand wash',
    'makeup', 'cosmetics', 'beauty kit', 'compact', 'setting spray', 'setting powder',
    'bb cream', 'cc cream', 'skin care', 'skincare', 'hair care', 'haircare',
    'micellar', 'retinol', 'niacinamide', 'vitamin c serum', 'hyaluronic',
    'collagen', 'salicylic', 'benzoyl', 'spf', 'face oil', 'face mist',
    'under eye cream', 'dark circle', 'stretch mark', 'cellulite',
    'beard oil', 'beard wash', 'shaving cream', 'aftershave',
    'baby lotion', 'baby wash', 'baby shampoo', 'baby cream',
    'sunblock', 'tanning lotion', 'face serum', 'brightening', 'whitening cream'
  ],

  medicine: [
    'paracetamol', 'ibuprofen', 'antibiotic', 'capsule', 'syrup',
    'medicine', 'drug', 'pharmacy', 'multivitamin', 'vitamin supplement',
    'vitamin tablet', 'vitamin tablets', 'vitamin capsule', 'vitamin d',
    'protein powder', 'whey protein',
    'probiotic', 'insulin', 'inhaler', 'ointment', 'antiseptic',
    'bandage', 'thermometer', 'glucometer', 'blood pressure monitor',
    'pulse oximeter', 'nebulizer', 'dolo', 'crocin', 'azithromycin',
    'cetirizine', 'omeprazole', 'pantoprazole', 'metformin', 'atorvastatin',
    'tablet medicine', 'medicine tablet', 'health supplement',
    'dietary supplement', 'immunity booster',
    'zinc supplement', 'omega 3', 'fish oil', 'calcium supplement',
    'pain relief', 'pain killer', 'fever tablet', 'cold tablet',
    'cough syrup', 'antacid', 'digene', 'ors', 'electrolyte',
    'wound care', 'antiseptic cream', 'surgical', 'medical supply',
    'face mask n95', 'sanitizer', 'hand sanitizer', 'surgical mask'
  ],

  electronics: [
    'iphone', 'smartphone', 'samsung phone', 'oneplus', 'pixel phone',
    'redmi', 'realme', 'oppo', 'vivo', 'motorola', 'nokia phone',
    'laptop', 'notebook', 'macbook', 'chromebook', 'dell laptop', 'hp laptop',
    'television', 'led tv', 'oled', 'qled', 'smart tv', 'android tv',
    'lloyd', 'split ac', 'window ac', 'inverter ac', '1.5 ton', '3 star ac',
    'earphone', 'earbuds', 'headphone', 'headset', 'bluetooth earphones', 'tws',
    'speaker', 'soundbar', 'home theatre', 'bluetooth speaker',
    'dslr', 'mirrorless camera', 'action camera', 'gopro', 'camera lens',
    'ipad', 'kindle', 'fire tablet', 'android tablet',
    'smartwatch', 'fitness band', 'wearable', 'smart band',
    'power bank', 'charger', 'data cable', 'wifi router', 'mesh router',
    'monitor', 'keyboard', 'webcam', 'hard disk', 'solid state drive', 'ssd',
    'refrigerator', 'washing machine', 'microwave oven', 'air conditioner',
    'gaming console', 'playstation', 'xbox', 'nintendo', 'gaming chair',
    'graphics card', 'processor', 'drone', 'projector', 'printer', 'scanner',
    'electric trimmer', 'electric shaver', 'hair dryer', 'hair straightener',
    'electric toothbrush', 'electric kettle', 'induction cooktop',
    'phone', 'camera', 'tablet', 'router', 'bluetooth', 'hdmi', 'usb',
    'samsung', 'nokia', 'television', 'smart home', 'alexa', 'google home',
    'ceiling fan', 'table fan', 'air cooler', 'geyser', 'water heater',
    'set top box', 'streaming stick', 'chromecast', 'fire stick'
  ],

  fashion: [
    'shirt', 'tshirt', 't-shirt', 'polo shirt', 'kurta', 'kurti', 'ethnic top',
    'jeans', 'trouser', 'chinos', 'joggers', 'track pant', 'shorts', 'cargo',
    'dress', 'gown', 'lehenga', 'saree', 'salwar', 'ethnic wear', 'dupatta',
    'jacket', 'blazer', 'overcoat', 'hoodie', 'sweatshirt', 'sweater', 'cardigan',
    'sneakers', 'heels', 'sandals', 'slippers', 'boots', 'loafers', 'mules',
    'footwear', 'flip flops', 'sports shoes', 'running shoes', 'formal shoes',
    'handbag', 'backpack', 'tote bag', 'sling bag', 'clutch', 'wallet', 'purse',
    'jewellery', 'earring', 'necklace', 'bracelet', 'bangle', 'ring', 'pendant',
    'sunglasses', 'fashion belt', 'scarf', 'cap', 'beanie', 'hat', 'turban',
    'lingerie', 'innerwear', 'socks', 'suit', 'sherwani', 'dhoti', 'pajama',
    'leggings', 'track suit', 'denim', 'ethnic', 'apparel', 'outfit', 'wear',
    'swimwear', 'kids wear', 'baby clothes', 'fashion', 'clothing', 'activewear',
    'shoes', 'bag', 'dress', 'jeans', 'kurta', 'saree', 'cotton dress',
    'formal wear', 'party wear', 'western wear', 'traditional wear'
  ],

  home: [
    'sofa', 'mattress', 'pillow', 'bedsheet', 'blanket', 'comforter', 'quilt',
    'dining table', 'study desk', 'wardrobe', 'bookshelf', 'cabinet',
    'ceiling lamp', 'table lamp', 'led bulb', 'chandelier', 'night lamp',
    'curtain', 'blinds', 'carpet', 'doormat', 'rug',
    'pressure cooker', 'non stick pan', 'kadai', 'cookware', 'tawa',
    'dinner plate', 'serving bowl', 'water bottle', 'thermos flask', 'lunch box',
    'kitchen knife', 'chopping board', 'spatula', 'ladle',
    'mixer grinder', 'juicer', 'blender', 'food processor', 'hand blender',
    'bread toaster', 'sandwich maker', 'electric kettle',
    'storage box', 'organizer', 'airtight container', 'modular kitchen',
    'bath towel', 'shower curtain', 'toilet seat', 'bathroom accessories',
    'wall art', 'photo frame', 'wall clock', 'decorative',
    'floor cleaner', 'vacuum cleaner', 'mop', 'broom', 'dustbin',
    'water purifier', 'air purifier', 'humidifier', 'dehumidifier',
    'home decor', 'furniture', 'garden', 'plant pot', 'gardening',
    'sofa', 'bed', 'table', 'chair', 'lamp', 'cookware', 'utensil',
    'bed frame', 'recliner', 'bean bag', 'coffee table', 'side table',
    'prestige cooker', 'hawkins', 'kitchen appliance'
  ],

  groceries: [
    'basmati rice', 'brown rice', 'toor dal', 'chana dal', 'whole wheat atta',
    'dates', 'almonds', 'cashew', 'raisins', 'milk', 'olive oil', 'peanut butter',
    'rice', 'atta', 'dal', 'oil', 'ghee', 'butter', 'paneer', 'curd',
    'refined flour', 'besan flour', 'refined sugar', 'rock salt',
    'sunflower oil', 'mustard oil', 'pure ghee', 'amul butter',
    'full cream milk', 'hung curd', 'greek yogurt', 'fresh paneer',
    'digestive biscuit', 'potato chips', 'masala namkeen', 'microwave popcorn',
    'instant noodles', 'whole wheat pasta', 'sliced bread', 'whole grain bread',
    'masala tea', 'instant coffee', 'green tea bags', 'cold pressed juice',
    'garam masala', 'turmeric powder', 'red chilli powder', 'cumin seeds',
    'frozen vegetables', 'ready to eat meal', 'dry fruits', 'nuts',
    'grocery', 'groceries', 'ration', 'pantry', 'staples',
    'organic food', 'vegan food', 'protein bar', 'energy bar'
  ]
};

const BRAND_SIGNALS = {
  electronics: [
    'apple', 'iphone', 'samsung', 'motorola', 'moto', 'oneplus', 'oppo', 'vivo',
    'redmi', 'realme', 'xiaomi', 'pixel', 'google pixel', 'dell', 'hp', 'lenovo',
    'asus', 'acer', 'sony', 'lg', 'lloyd', 'voltas', 'haier', 'whirlpool',
    'panasonic', 'toshiba', 'jbl', 'boat', 'boult', 'noise', 'zebronics',
    'mi', 'poco', 'iqoo', 'tecno', 'infinix', 'lava', 'micromax',
    'logitech', 'hp printer', 'canon', 'epson', 'brother',
    'intel', 'amd', 'nvidia', 'seagate', 'western digital', 'kingston',
    'dlink', 'tplink', 'netgear', 'asus router'
  ],
  fashion: [
    'nike', 'adidas', 'puma', 'reebok', 'levis', "levi's", 'zara', 'hm',
    'h&m', 'roadster', 'hrx', 'biba', 'wrogn', 'allen solly', 'peter england',
    'raymond', 'van heusen', 'arrow', 'park avenue', 'monte carlo',
    'bata', 'metro shoes', 'woodland', 'red tape', 'liberty shoes',
    'crocs', 'skechers', 'new balance', 'fila', 'under armour', 'asics',
    'fastrack', 'titan', 'fossil', 'casio', 'daniel wellington'
  ],
  beauty: [
    'cetaphil', 'minimalist', 'lakme', 'maybelline', 'loreal', "l'oreal",
    'nykaa', 'plum', 'dot and key', 'the ordinary', 'mamaearth', 'biotique',
    'himalaya', 'forest essentials', 'kama ayurveda', 'wow', 'sugar cosmetics',
    'colorbar', 'faces canada', 'mac', 'nars', 'bobbi brown', 'clinique',
    'neutrogena', 'ponds', 'olay', 'nivea', 'dove', 'garnier', 'head shoulders',
    'pantene', 'tresemme', 'dove shampoo', 'loreal shampoo', 'clinic plus',
    'gillette', 'venus', 'veet', 'nair', 'streax'
  ],
  medicine: [
    'dolo', 'crocin', 'calpol', 'combiflam', 'zincovit', 'shelcal', 'becosules',
    'volini', 'digene', 'ors', 'disprin', 'brufen', 'meftal', 'flexon',
    'azithral', 'augmentin', 'amoxicillin', 'montek', 'allegra', 'asthalin',
    'glycomet', 'atorva', 'ecosprin', 'pantodac', 'pan d', 'omez',
    'dabur', 'himalaya tablets', 'hamdard', 'baidyanath', 'patanjali tablets',
    'ensure', 'pediasure', 'horlicks', 'boost', 'complan', 'protinex'
  ],
  home: [
    'prestige', 'pigeon', 'havells', 'philips', 'bajaj', 'butterfly', 'milton',
    'cello', 'borosil', 'hawkins', 'vinod', 'meyer', 'tefal', 'le creuset',
    'nilkamal', 'godrej furniture', 'pepperfry', 'urban ladder',
    'solimo', 'amazon basics', 'vega', 'lifelong', 'agaro',
    'eureka forbes', 'kent', 'aquaguard', 'pureit', 'a o smith'
  ],
  groceries: [
    'amul', 'aashirvaad', 'fortune', 'tata salt', 'india gate', 'daawat',
    'bru', 'nescafe', 'maggi', 'mtr', 'catch', 'everest', 'mdh',
    'mother dairy', 'nestle', 'britannia', 'parle', 'haldirams',
    'lays', 'kurkure', 'bingo', 'sunfeast', 'good day', 'marie gold'
  ]
};

const PRODUCT_TYPES = {
  electronics: {
    smartphone: ['iphone', 'phone', 'smartphone', 'motorola edge', 'galaxy', 'oneplus', 'pixel', 'redmi note', 'realme', 'poco'],
    laptop: ['laptop', 'notebook', 'macbook', 'inspiron', 'thinkpad', 'vivobook', 'zenbook', 'omen', 'pavilion'],
    television: ['tv', 'television', 'oled', 'qled', 'smart tv', '55 inch', '65 inch', '43 inch', '32 inch'],
    air_conditioner: ['ac', 'air conditioner', 'split ac', 'window ac', '1.5 ton', '2 ton', 'inverter ac'],
    audio: ['earbuds', 'headphone', 'speaker', 'soundbar', 'tws', 'neckband'],
    appliance: ['refrigerator', 'washing machine', 'dishwasher', 'microwave', 'geyser']
  },
  fashion: {
    shoes: ['shoes', 'sneakers', 'air max', 'running shoes', 'footwear', 'heels', 'sandals', 'boots'],
    apparel: ['jeans', 'shirt', 'kurti', 'kurta', 'dress', 'saree', 'jacket', 'hoodie', 'tshirt'],
    accessories: ['bag', 'handbag', 'wallet', 'sunglasses', 'watch', 'belt', 'jewellery']
  },
  beauty: {
    skin_care: ['cleanser', 'face wash', 'serum', 'moisturizer', 'sunscreen', 'retinol', 'vitamin c', 'toner', 'eye cream'],
    makeup: ['lipstick', 'foundation', 'kajal', 'mascara', 'eyeliner', 'blush', 'concealer'],
    hair_care: ['shampoo', 'conditioner', 'hair oil', 'hair serum', 'hair mask', 'hair dye']
  },
  medicine: {
    otc_medicine: ['paracetamol', 'dolo', 'crocin', 'ibuprofen', 'cetirizine', 'antacid', 'cold tablet'],
    health_device: ['thermometer', 'glucometer', 'oximeter', 'blood pressure', 'nebulizer'],
    supplement: ['protein powder', 'multivitamin', 'omega 3', 'calcium', 'vitamin d', 'zinc']
  },
  home: {
    kitchen: ['pressure cooker', 'cookware', 'kadai', 'mixer grinder', 'toaster', 'kettle', 'tawa'],
    furniture: ['sofa', 'mattress', 'table', 'chair', 'wardrobe', 'bed frame'],
    decor: ['lamp', 'curtain', 'carpet', 'wall art', 'photo frame', 'clock']
  },
  groceries: {
    pantry: ['rice', 'atta', 'dal', 'oil', 'ghee', 'salt', 'sugar', 'masala', 'spice'],
    dry_fruits: ['dates', 'almonds', 'cashew', 'raisins'],
    dairy: ['milk', 'curd', 'paneer', 'butter']
  }
};

// Synonym / spelling correction map
const SYNONYMS = {
  motorolo: 'motorola',
  motorolla: 'motorola',
  cleanser: 'face wash',
  facewash: 'face wash',
  mobile: 'smartphone',
  cellphone: 'smartphone',
  mobilephone: 'smartphone',
  refrigerator: 'fridge',
  ac: 'air conditioner',
  aircon: 'air conditioner',
  tee: 'tshirt',
  trainer: 'shoes',
  trainers: 'shoes',
  sneaker: 'sneakers',
  earbud: 'earbuds',
  headphones: 'headphone',
  earphone: 'earphones',
  tablet: 'tablet',
  ipad: 'ipad tablet',
  ssd: 'solid state drive',
  powerbank: 'power bank',
  smartwatch: 'smart watch',
  dolo650: 'dolo',
  crocin650: 'crocin',
  paracetamol650: 'paracetamol',
  lipbalm: 'lip balm',
  bodylotion: 'body lotion',
  sunscream: 'sunscreen',
  vitaminc: 'vitamin c serum'
};

function normalizeQuery(query) {
  let text = String(query || '').toLowerCase().trim();
  Object.entries(SYNONYMS).forEach(([from, to]) => {
    text = text.replace(new RegExp(`\\b${from}\\b`, 'g'), `${from} ${to}`);
  });
  return text.replace(/[^a-z0-9.'\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function termMatches(text, term) {
  const normalizedTerm = normalizeQuery(term);
  if (!normalizedTerm) return false;
  return new RegExp(`(^|\\s)${escapeRegex(normalizedTerm)}(\\s|$)`, 'i').test(text);
}

function scoreMatches(text, terms, weight) {
  return terms.reduce((score, term) => {
    if (!term) return score;
    if (termMatches(text, term)) return score + weight + Math.min(term.length, 16) / 4;
    return score;
  }, 0);
}

function findSubtype(text, category) {
  const types = PRODUCT_TYPES[category] || {};
  let best = { subtype: '', score: 0 };
  Object.entries(types).forEach(([subtype, terms]) => {
    const score = scoreMatches(text, terms, 4);
    if (score > best.score) best = { subtype, score };
  });
  return best.subtype;
}

function detectCategoryDetails(query) {
  if (!query || typeof query !== 'string') {
    return { category: 'general', subtype: '', confidence: 0, matchedSignals: [] };
  }

  const text = normalizeQuery(query);
  const scores = {};
  const matchedSignals = [];

  Object.keys(CATEGORY_KEYWORDS).forEach((category) => {
    const keywordScore = scoreMatches(text, CATEGORY_KEYWORDS[category], 3);
    const brandScore   = scoreMatches(text, BRAND_SIGNALS[category] || [], 5);
    const subtype      = findSubtype(text, category);
    const subtypeScore = subtype ? 6 : 0;
    scores[category]   = keywordScore + brandScore + subtypeScore;
  });

  const ranked = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [category, score] = ranked[0] || ['general', 0];
  const nextScore = ranked[1] ? ranked[1][1] : 0;

  if (score <= 0) {
    return { category: 'general', subtype: '', confidence: 0, matchedSignals };
  }

  // Improved confidence: gap between top and second score matters more
  const gap = score - nextScore;
  const confidence = Math.min(0.98, Math.max(0.35, (gap + 4) / (score + 6)));
  const subtype = findSubtype(text, category);

  return {
    category: confidence >= 0.35 ? category : 'general',
    subtype,
    confidence: Number(confidence.toFixed(2)),
    matchedSignals
  };
}

/**
 * Detect category from search query using scoring.
 *
 * @param {string} query - User search query
 * @returns {string} Category name
 */
function detectCategory(query) {
  return detectCategoryDetails(query).category;
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

module.exports = { detectCategory, detectCategoryDetails, getCategoryLabel, CATEGORY_KEYWORDS };
