/**
 * @module config/brandRegistry
 * @description Reusable brand registry for search intent and relevance.
 */

const brandRegistry = {
  electronics: [
    'Apple', 'Samsung', 'Motorola', 'OnePlus', 'Xiaomi', 'Redmi', 'Realme',
    'Google', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Sony', 'LG', 'Lloyd',
    'Voltas', 'Haier', 'Whirlpool', 'Croma', 'Vijay Sales', 'Boat', 'JBL'
  ],
  fashion: [
    'Nike', 'Adidas', 'Puma', "Levi's", 'Levis', 'Reebok', 'Skechers',
    'Bata', 'Woodland', 'Red Tape', 'Zara', 'H&M', 'Biba', 'Roadster'
  ],
  beauty: [
    'Cetaphil', 'CeraVe', 'Minimalist', 'Lakme', 'Maybelline', 'Mamaearth',
    "L'Oreal", 'Loreal', 'Nykaa', 'Plum', 'Dot & Key', 'Neutrogena',
    'Nivea', 'Dove', 'Garnier', 'Himalaya'
  ],
  medicine: [
    'Crocin', 'Dolo', 'Paracetamol', 'Calpol', 'Combiflam', 'Zincovit',
    'Shelcal', 'Becosules', 'Volini', 'Digene', 'ORS'
  ],
  home: [
    'Prestige', 'Hawkins', 'Pigeon', 'Philips', 'Bajaj', 'Butterfly',
    'Milton', 'Cello', 'Borosil', 'Godrej', 'Nilkamal'
  ],
  groceries: [
    'Amul', 'Aashirvaad', 'Fortune', 'Tata Salt', 'India Gate', 'Daawat',
    'Bru', 'Nescafe', 'Maggi', 'MTR', 'Everest', 'MDH', 'Happilo',
    'Farmley', 'Nutraj', 'Mother Dairy'
  ]
};

const brandAliases = {
  iphone: 'Apple',
  macbook: 'Apple',
  moto: 'Motorola',
  mi: 'Xiaomi',
  levis: "Levi's",
  "levi's": "Levi's",
  loreal: "L'Oreal",
  "l'oreal": "L'Oreal",
  dolo650: 'Dolo',
  crocin650: 'Crocin',
  paracetamol650: 'Paracetamol'
};

function normalizeBrand(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const key = text.toLowerCase().replace(/[^a-z0-9']/g, '');
  return brandAliases[key] || text;
}

function getAllBrands() {
  return Object.values(brandRegistry).flat();
}

function getBrandCategory(brand) {
  const normalized = normalizeBrand(brand).toLowerCase();
  return Object.entries(brandRegistry).find(([, brands]) =>
    brands.some((entry) => normalizeBrand(entry).toLowerCase() === normalized)
  )?.[0] || '';
}

module.exports = {
  brandRegistry,
  brandAliases,
  normalizeBrand,
  getAllBrands,
  getBrandCategory
};
