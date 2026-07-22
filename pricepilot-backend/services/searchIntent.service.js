/**
 * @module searchIntent.service
 * @description Parses user shopping queries into structured search intent.
 *
 * Phase 3 upgrades:
 *  - Expanded PRODUCT_TYPE_TERMS: covers all 6 categories (electronics, fashion,
 *    beauty, medicine, home, groceries) with 80+ product types
 *  - searchMode detection: 'exact' | 'branded' | 'generic' | 'category'
 *  - productCore extraction: the main product noun after stripping brand/quantity/variant
 *  - Improved quantity extraction: handles leading patterns ("1kg dates", "500ml olive oil")
 *  - Expanded SUGGESTION_CATALOG to cover all supported categories
 */

const { detectCategoryDetails } = require('./categoryDetector');
const { brandRegistry, brandAliases, normalizeBrand, getAllBrands, getBrandCategory } = require('../config/brandRegistry');

const QUERY_CORRECTIONS = {
  motorolo:    'motorola',
  motorolla:   'motorola',
  cetafil:     'cetaphil',
  cetaphill:   'cetaphil',
  'one pluss': 'oneplus',
  onepluss:    'oneplus',
  nikey:       'nike',
  samsang:     'samsung',
  iphne:       'iphone',
  iphnoe:      'iphone',
  levies:      "levi's",
  // grocery common typos
  almonds:     'almonds',
  almond:      'almonds',
  cashews:     'cashew',
  raisins:     'raisins',
  // medicine typos
  paracetamole: 'paracetamol',
  ibuprofen:    'ibuprofen'
};

const FAMILY_ALIASES = {
  iphone:   'iPhone',
  galaxy:   'Galaxy',
  edge:     'Edge',
  razr:     'Razr',
  oneplus:  'OnePlus',
  inspiron: 'Inspiron',
  pavilion: 'Pavilion',
  thinkpad: 'ThinkPad',
  vivobook: 'Vivobook',
  air:      'Air',
  airmax:   'Air Max'
};

/**
 * Expanded product type terms covering ALL 6 categories.
 * Used for:
 *   1. detectProductType() — identifies product type from query
 *   2. searchMode detection — sets hasProductType flag
 */
const PRODUCT_TYPE_TERMS = {
  // ── Electronics ────────────────────────────────────────────────────────────
  smartphone:       ['iphone', 'phone', 'smartphone', 'galaxy', 'edge', 'oneplus', 'pixel', 'redmi', 'realme', 'moto', 'mobile phone', 'android phone'],
  laptop:           ['laptop', 'macbook', 'notebook', 'inspiron', 'thinkpad', 'vivobook', 'pavilion', 'chromebook'],
  television:       ['tv', 'television', 'smart tv', 'oled', 'qled', 'led tv', 'android tv'],
  air_conditioner:  ['ac', 'air conditioner', 'split ac', 'window ac', 'inverter ac'],
  keyboard:         ['keyboard', 'mechanical keyboard', 'gaming keyboard', 'wireless keyboard'],
  mouse:            ['mouse', 'gaming mouse', 'wireless mouse'],
  headphone:        ['headphone', 'headphones', 'earphone', 'earphones', 'earbuds', 'tws', 'neckband', 'headset'],
  speaker:          ['speaker', 'bluetooth speaker', 'soundbar', 'home theatre'],
  smartwatch:       ['smartwatch', 'smart watch', 'fitness band', 'fitness tracker'],
  camera:           ['camera', 'dslr', 'mirrorless', 'action camera', 'gopro'],
  tablet:           ['tablet', 'ipad', 'fire tablet', 'android tablet'],
  monitor:          ['monitor', 'led monitor', 'gaming monitor', 'curved monitor'],
  power_bank:       ['power bank', 'powerbank', 'portable charger'],
  router:           ['router', 'wifi router', 'mesh router'],
  hard_disk:        ['hard disk', 'hard drive', 'ssd', 'solid state drive', 'external hard disk', 'pendrive', 'pen drive'],
  refrigerator:     ['refrigerator', 'fridge', 'double door', 'single door', 'frost free'],
  washing_machine:  ['washing machine', 'front load', 'top load'],
  microwave:        ['microwave', 'microwave oven', 'convection oven'],
  trimmer:          ['trimmer', 'beard trimmer', 'hair trimmer', 'electric shaver'],
  printer:          ['printer', 'laser printer', 'inkjet printer'],
  gaming_console:   ['playstation', 'xbox', 'nintendo', 'gaming console', 'ps5', 'ps4'],
  graphics_card:    ['graphics card', 'gpu', 'nvidia', 'rtx', 'gtx'],

  // ── Fashion ────────────────────────────────────────────────────────────────
  shoes:            ['shoes', 'sneakers', 'running shoes', 'sports shoes', 'footwear', 'formal shoes', 'casual shoes', 'air max'],
  sandals:          ['sandals', 'slippers', 'flip flops', 'heels', 'wedges'],
  boots:            ['boots', 'ankle boots', 'chelsea boots'],
  jeans:            ['jeans', 'denim', 'skinny jeans', 'slim fit jeans'],
  shirt:            ['shirt', 'tshirt', 't-shirt', 'polo shirt', 'formal shirt'],
  kurta:            ['kurta', 'kurti', 'ethnic top', 'salwar', 'dupatta'],
  dress:            ['dress', 'gown', 'maxi dress', 'party dress'],
  hoodie:           ['hoodie', 'sweatshirt', 'pullover'],
  jacket:           ['jacket', 'blazer', 'overcoat', 'windbreaker'],
  saree:            ['saree', 'silk saree', 'cotton saree', 'lehenga'],
  handbag:          ['handbag', 'tote bag', 'sling bag', 'clutch', 'backpack', 'wallet', 'purse'],
  watch:            ['watch', 'wristwatch', 'analog watch', 'digital watch'],
  sunglasses:       ['sunglasses', 'eyewear', 'glasses'],
  cap:              ['cap', 'hat', 'beanie', 'baseball cap'],

  // ── Beauty ─────────────────────────────────────────────────────────────────
  cleanser:         ['cleanser', 'face wash', 'facewash', 'facial cleanser', 'foaming cleanser', 'gel cleanser', 'cream cleanser', 'gentle cleanser'],
  moisturizer:      ['moisturizer', 'moisturiser', 'face cream', 'day cream', 'night cream', 'face lotion'],
  serum:            ['serum', 'face serum', 'vitamin c serum', 'retinol serum', 'hyaluronic serum', 'niacinamide serum'],
  sunscreen:        ['sunscreen', 'spf', 'sun cream', 'sunblock', 'tanning lotion', 'uv protection'],
  lipstick:         ['lipstick', 'lip gloss', 'lip liner', 'lip balm', 'lip tint'],
  foundation:       ['foundation', 'bb cream', 'cc cream', 'concealer', 'primer'],
  eye_makeup:       ['mascara', 'eyeliner', 'kajal', 'eyeshadow', 'eye pencil'],
  shampoo:          ['shampoo', 'hair shampoo', 'dandruff shampoo', 'anti hair fall shampoo'],
  conditioner:      ['conditioner', 'hair conditioner', 'hair mask'],
  hair_oil:         ['hair oil', 'coconut oil for hair', 'onion hair oil'],
  perfume:          ['perfume', 'fragrance', 'deodorant', 'body mist', 'cologne', 'eau de toilette'],
  body_lotion:      ['body lotion', 'body wash', 'shower gel', 'body cream'],
  toner:            ['toner', 'face toner', 'astringent', 'essence'],
  face_mask:        ['face mask', 'sheet mask', 'peel off mask', 'face pack'],
  scrub:            ['scrub', 'face scrub', 'exfoliator', 'body scrub'],

  // ── Medicine ───────────────────────────────────────────────────────────────
  paracetamol:      ['paracetamol', 'dolo', 'crocin', 'calpol', 'fever tablet', 'paracetamol tablet'],
  antacid:          ['antacid', 'digene', 'eno', 'omeprazole', 'pantoprazole'],
  antibiotic:       ['antibiotic', 'azithromycin', 'amoxicillin', 'ciprofloxacin'],
  vitamin_supplement: ['multivitamin', 'vitamin c', 'vitamin d', 'vitamin tablet', 'vitamin supplement', 'zinc supplement', 'omega 3', 'fish oil', 'calcium supplement', 'iron supplement'],
  protein_powder:   ['protein powder', 'whey protein', 'mass gainer', 'protein supplement'],
  pain_relief:      ['pain killer', 'pain relief', 'ibuprofen', 'combiflam', 'volini', 'spray'],
  health_device:    ['thermometer', 'glucometer', 'oximeter', 'blood pressure monitor', 'nebulizer', 'bp monitor'],
  syrup:            ['syrup', 'cough syrup', 'suspension'],
  antiseptic:       ['antiseptic', 'dettol', 'savlon', 'betadine'],
  sanitizer:        ['sanitizer', 'hand sanitizer', 'disinfectant'],

  // ── Home ───────────────────────────────────────────────────────────────────
  pressure_cooker:  ['pressure cooker', 'hawkins cooker', 'prestige cooker'],
  cookware:         ['cookware', 'kadai', 'tawa', 'non stick pan', 'frying pan'],
  mixer_grinder:    ['mixer grinder', 'mixer', 'blender', 'juicer'],
  water_bottle:     ['water bottle', 'thermos', 'sipper', 'flask'],
  bedsheet:         ['bedsheet', 'bed sheet', 'blanket', 'comforter', 'pillow'],
  mattress:         ['mattress', 'memory foam mattress', 'orthopaedic mattress'],
  sofa:             ['sofa', 'couch', 'recliner', 'sofa set'],
  dining_table:     ['dining table', 'study desk', 'coffee table'],
  water_purifier:   ['water purifier', 'ro purifier', 'kent', 'aquaguard'],
  lamp:             ['lamp', 'led bulb', 'table lamp', 'ceiling lamp'],
  vacuum_cleaner:   ['vacuum cleaner', 'robot vacuum', 'wet dry vacuum'],

  // ── Groceries ──────────────────────────────────────────────────────────────
  dates:            ['dates', 'medjool dates', 'dried dates', 'khajoor'],
  almonds:          ['almonds', 'almond', 'badam', 'roasted almonds', 'blanched almonds'],
  cashew:           ['cashew', 'cashews', 'kaju', 'roasted cashew'],
  raisins:          ['raisins', 'kishmish', 'sultana'],
  dry_fruits:       ['dry fruits', 'mixed dry fruits', 'mixed nuts', 'trail mix'],
  rice:             ['rice', 'basmati rice', 'brown rice', 'sona masoori', 'jasmine rice'],
  atta:             ['atta', 'wheat flour', 'whole wheat atta', 'multigrain atta'],
  dal:              ['dal', 'toor dal', 'chana dal', 'moong dal', 'masoor dal'],
  olive_oil:        ['olive oil', 'extra virgin olive oil', 'pomace olive oil', 'organic olive oil'],
  cooking_oil:      ['cooking oil', 'sunflower oil', 'mustard oil', 'refined oil', 'groundnut oil'],
  ghee:             ['ghee', 'desi ghee', 'pure ghee', 'cow ghee'],
  milk:             ['milk', 'full cream milk', 'toned milk', 'skimmed milk'],
  paneer:           ['paneer', 'cottage cheese', 'fresh paneer'],
  peanut_butter:    ['peanut butter', 'almond butter', 'nut butter'],
  oats:             ['oats', 'rolled oats', 'instant oats', 'oatmeal'],
  sugar:            ['sugar', 'refined sugar', 'brown sugar', 'jaggery', 'powdered sugar'],
  salt:             ['salt', 'rock salt', 'himalayan pink salt', 'sea salt', 'iodized salt'],
  tea:              ['tea', 'green tea', 'masala tea', 'herbal tea', 'black tea'],
  coffee:           ['coffee', 'instant coffee', 'ground coffee', 'espresso'],
  spices:           ['masala', 'garam masala', 'turmeric', 'chilli powder', 'cumin', 'coriander powder'],
  noodles:          ['noodles', 'instant noodles', 'pasta', 'maggi', 'ramen'],
  bread:            ['bread', 'whole wheat bread', 'multigrain bread', 'white bread'],
  biscuits:         ['biscuits', 'cookies', 'digestive biscuits', 'crackers']
};

/**
 * Pure category words — searching just this word means "show me everything in this category"
 */
const CATEGORY_WORDS = new Set([
  'electronics', 'phones', 'laptops', 'mobiles',
  'fashion', 'clothing', 'apparel',
  'beauty', 'cosmetics', 'skincare',
  'medicine', 'medicines', 'pharmacy',
  'grocery', 'groceries', 'food',
  'home', 'furniture', 'kitchen'
]);

const SUGGESTION_CATALOG = [
  // Electronics
  'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
  'Samsung Galaxy S25', 'Samsung Galaxy A55', 'OnePlus 13',
  'Motorola Edge 50 Fusion', 'Motorola G85', 'Motorola Razr',
  'Dell Laptop', 'HP Laptop', 'Lenovo ThinkPad', 'MacBook Air M2',
  'Samsung TV 55 inch', 'LG OLED TV', 'Sony Bravia TV',
  'Logitech Keyboard', 'Mechanical Keyboard', 'Wireless Keyboard',
  'Boat Earbuds', 'Sony Headphones', 'JBL Speaker',
  'Lloyd AC 1.5 Ton 3 Star', 'Voltas 1.5 Ton AC',
  // Fashion
  'Nike Shoes', 'Nike Air Max', 'Adidas Sneakers', 'Puma Running Shoes',
  "Levi's Jeans", "Women's Kurti", 'Black Hoodie', 'Formal Shirt',
  // Beauty
  'Cetaphil Gentle Skin Cleanser', 'Cetaphil Moisturizer', 'Cetaphil Face Wash',
  'Minimalist Vitamin C Serum', 'Minimalist Niacinamide Serum',
  'Mamaearth Vitamin C Face Wash', 'Lakme Foundation', 'Maybelline Lipstick',
  'Sunscreen SPF 50', 'Face Wash for Oily Skin', 'Cleanser for Dry Skin',
  // Medicine
  'Paracetamol 650', 'Dolo 650', 'Crocin', 'Vitamin D3 Supplement',
  'Multivitamin Tablets', 'Omega 3 Fish Oil', 'Whey Protein',
  // Grocery
  '1kg Dates', 'Almonds 500g', 'Cashew 250g', 'Mixed Dry Fruits 500g',
  'Olive Oil 500ml', 'Extra Virgin Olive Oil 1L',
  'Aashirvaad Atta 5kg', 'India Gate Basmati Rice 5kg',
  'Amul Ghee 1L', 'Fortune Sunflower Oil 1L',
  'Green Tea Bags', 'Nescafe Instant Coffee',
  'Garam Masala', 'Tata Salt 1kg'
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(\d+)\s*(gb|tb|inch|in|ton|kg|ml|g|gm|gram|grams|litre|liter|litres|liters|l)\b/g, '$1 $2')
    .replace(/[^a-z0-9.'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => FAMILY_ALIASES[part.toLowerCase().replace(/\s/g, '')] || part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function correctQuery(query) {
  let corrected = normalizeText(query);
  Object.entries(QUERY_CORRECTIONS).forEach(([from, to]) => {
    corrected = corrected.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  });
  return corrected;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectBrand(text) {
  const normalized = normalizeText(text);
  const candidates = [
    ...getAllBrands().map((brand) => ({ match: normalizeText(brand), brand: normalizeBrand(brand) })),
    ...Object.entries(brandAliases).map(([alias, brand]) => ({ match: normalizeText(alias), brand }))
  ].sort((a, b) => b.match.length - a.match.length);

  const found = candidates.find(({ match }) => new RegExp(`(^|\\s)${escapeRegex(match)}(\\s|$)`, 'i').test(normalized));
  return found ? normalizeBrand(found.brand) : '';
}

function removePhrase(text, phrase) {
  if (!phrase) return text;
  return text.replace(new RegExp(`(^|\\s)${escapeRegex(normalizeText(phrase))}(\\s|$)`, 'ig'), ' ').replace(/\s+/g, ' ').trim();
}

function detectVariant(text) {
  const normalized = normalizeText(text);
  const matches = [
    ...normalized.matchAll(/\b(?:[2-9]|1[026]|12|16|32)\s*gb\s*ram\b/g),
    ...normalized.matchAll(/\b(?:32|64|128|256|512|1024)\s*gb\b|\b[12]\s*tb\b/g),
    ...normalized.matchAll(/\b\d+(?:\.\d+)?\s*(?:ton|inch|in|kg|g|gm|gram|grams|ml|l|litre|liter|litres|liters)\b/g),
    ...normalized.matchAll(/\bsize\s*\d{1,2}\b/g),
    ...normalized.matchAll(/\bpack\s+of\s+\d+\b/g),
    ...normalized.matchAll(/\b[1-5]\s*star\b/g),
    ...normalized.matchAll(/\b(?:black|white|blue|green|red|pink|gold|silver|grey|gray|purple|yellow|titanium|midnight|starlight|lavender)\b/g)
  ].map((match) => match[0]);

  return [...new Set(matches)].join(' ');
}

/**
 * Detect product type from query text using the expanded PRODUCT_TYPE_TERMS map.
 * Returns the most specific matching product type key.
 */
function detectProductType(text, categorySubtype) {
  const normalized = normalizeText(text);
  let best = categorySubtype || '';
  let bestScore = best ? 1 : 0;

  Object.entries(PRODUCT_TYPE_TERMS).forEach(([type, terms]) => {
    const score = terms.reduce((sum, term) => normalized.includes(normalizeText(term)) ? sum + term.length : sum, 0);
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  });

  return best;
}

/**
 * Extract the product core noun — the main product after stripping
 * brand, quantity, variant, and common modifiers.
 *
 * Example: "Cetaphil Cleanser 250ml" → "cleanser"
 * Example: "1kg Dates" → "dates"
 * Example: "Nike Shoes Size 9" → "shoes"
 */
function extractProductCore(text, brand, variant) {
  let remaining = normalizeText(text);

  // Remove brand
  remaining = removePhrase(remaining, brand);

  // Remove quantity/size tokens (including leading quantity like "1kg", "500ml")
  remaining = remaining
    .replace(/\b\d+(?:\.\d+)?\s*(?:kg|g|gm|gram|grams|ml|l|litre|liter|litres|liters|ton|inch)\b/gi, ' ')
    .replace(/\bpack\s+of\s+\d+\b/gi, ' ')
    .replace(/\bsize\s*\d{1,2}\b/gi, ' ')
    .replace(/\b(?:32|64|128|256|512|1024)\s*gb\b|\b[12]\s*tb\b/gi, ' ')
    .replace(/\b[1-5]\s*star\b/gi, ' ')
    .replace(/\b(?:black|white|blue|green|red|pink|gold|silver|grey|gray|purple|yellow|titanium|midnight|starlight|lavender)\b/gi, ' ')
    .replace(/\b(?:extra|virgin|pure|organic|refined|roasted|raw|premium|original|classic|pro|max|plus|ultra|lite|mini|air|new|latest|best)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // The longest remaining token that isn't a number is most likely the product core
  const tokens = remaining.split(' ').filter((t) => t && !/^\d+$/.test(t));
  return tokens.join(' ').trim();
}

/**
 * Detect search mode — determines how aggressively to apply relevance filtering.
 *
 * Modes:
 *   'exact'    — Specific brand + model + variant (e.g., "iPhone 16 Pro Max 256GB Black")
 *   'branded'  — Brand + product type, no specific model (e.g., "Nike Shoes", "Cetaphil Cleanser")
 *   'generic'  — Product type only, no brand (e.g., "keyboard", "cleanser", "1kg dates")
 *   'category' — Category word only (e.g., "electronics", "beauty", "grocery")
 */
function detectSearchMode(intent) {
  const { brand, family, model, variant, productType, tokens } = intent;

  // Category-only search
  if (!brand && !family && !model && !productType && tokens.length <= 2) {
    const queryText = tokens.join(' ');
    if (CATEGORY_WORDS.has(queryText)) return 'category';
  }

  // Exact search: has brand AND (model or variant or both)
  if (brand && (model || (variant && variant.length > 0))) return 'exact';

  // Branded: has brand, has product type or family, but no specific model/variant
  if (brand && (family || productType)) return 'branded';

  // Single brand name or brand with generic product (Nike Shoes = branded)
  if (brand) return 'branded';

  // Generic: no brand, but has a product type
  if (productType) return 'generic';

  // Category-only
  if (tokens.length <= 1 && CATEGORY_WORDS.has(tokens[0] || '')) return 'category';

  // Fallback: generic
  return 'generic';
}

function detectFamilyAndModel(text, brand, variant) {
  let remaining = normalizeText(text);
  remaining = removePhrase(remaining, brand);
  remaining = removePhrase(remaining, variant);
  remaining = remaining.replace(/\b(?:phone|smartphone|mobile|laptop|tv|television|shoes|sneakers|cleanser|tablet|watch)\b/g, ' ');
  remaining = remaining.replace(/\s+/g, ' ').trim();

  const tokens = remaining.split(' ').filter(Boolean);
  const familyToken = tokens.find((token) => !/^\d+$/.test(token)) || '';
  const familyIndex = tokens.indexOf(familyToken);
  const modelTokens = familyIndex >= 0 ? tokens.slice(familyIndex + 1, familyIndex + 4) : [];
  const model = modelTokens.filter((token) =>
    /^\d/.test(token) || /^[a-z]+$/.test(token) || /^(pro|max|plus|fusion|air|ultra|star)$/.test(token)
  ).join(' ');

  return {
    family: titleCase(familyToken),
    model:  titleCase(model)
  };
}

/**
 * Extract quantity from text — handles both leading and trailing patterns:
 *   "1kg Dates"       → "1 kg"
 *   "Olive Oil 500ml" → "500 ml"
 *   "Almonds 500g"    → "500 g"
 */
function extractQuantity(normalized) {
  // Matches: "500ml", "1kg", "250g", "1.5 litre", etc.
  const quantityPattern = /\b(\d+(?:\.\d+)?)\s*(kg|g|gm|gram|grams|ml|l|litre|liter|litres|liters)\b/;
  const match = normalized.match(quantityPattern);
  if (!match) return '';
  return `${match[1]} ${match[2]}`;
}

function parseSearchIntent(query) {
  const originalQuery  = String(query || '').trim();
  const correctedQuery = correctQuery(originalQuery);
  const categoryDetails = detectCategoryDetails(correctedQuery);
  const brand           = detectBrand(correctedQuery);
  const brandCategory   = brand ? getBrandCategory(brand) : '';
  const category        = brandCategory || categoryDetails.category || 'general';
  const variant         = detectVariant(correctedQuery);
  const { family, model } = detectFamilyAndModel(correctedQuery, brand, variant);
  const productType     = detectProductType(correctedQuery, categoryDetails.subtype);
  const productCore     = extractProductCore(correctedQuery, brand, variant);
  const quantity        = extractQuantity(correctedQuery);

  const intentBase = {
    originalQuery,
    correctedQuery,
    corrected:          normalizeText(originalQuery) !== correctedQuery,
    category,
    categoryConfidence: categoryDetails.confidence,
    brand,
    family,
    model,
    variant,
    quantity,
    size:       variant.match(/\bsize\s*\d{1,2}\b/)?.[0] || '',
    color:      variant.match(/\b(?:black|white|blue|green|red|pink|gold|silver|grey|gray|purple|yellow|titanium|midnight|starlight|lavender)\b/)?.[0] || '',
    storage:    variant.match(/\b(?:32|64|128|256|512|1024)\s*gb\b|\b[12]\s*tb\b/)?.[0] || '',
    packSize:   variant.match(/\bpack\s+of\s+\d+\b/)?.[0] || '',
    productType,
    productCore,
    tokens:     normalizeText(correctedQuery).split(' ').filter(Boolean)
  };

  // searchMode must be computed after all fields are available
  const searchMode = detectSearchMode(intentBase);

  return {
    ...intentBase,
    searchMode
  };
}

function getSearchSuggestions(prefix, limit = 8) {
  const text = normalizeText(correctQuery(prefix));
  if (!text) return [];
  return SUGGESTION_CATALOG
    .filter((item) => normalizeText(item).includes(text))
    .slice(0, limit);
}

module.exports = {
  parseSearchIntent,
  correctQuery,
  getSearchSuggestions,
  normalizeText,
  detectBrand,
  detectVariant,
  detectProductType,
  detectSearchMode,
  brandRegistry
};
