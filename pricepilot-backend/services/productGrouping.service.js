/**
 * @module productGrouping.service
 * @description Groups normalized products from multiple providers into
 * comparison units (one card per product, multiple stores inside).
 *
 * Phase 2 upgrades:
 *  - Improved productFamilyKey: handles RAM, color codes, more variant patterns
 *  - Better cross-store matching: ≥70% token overlap = same product
 *  - bestDeal flag on cheapest/best store in each group
 *  - isBestDeal flag set on the winning store offer
 *  - More variant extraction patterns (color names, storage, size)
 */

function normaliseText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(\d+)\s*(gb|tb|inch|in|ton|kg|litre|liter|l|ml|gm|gram|g)\b/g, '$1 $2')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(plus|with|and|the|for|mobile|phone|smartphone|buy|online|new|latest|best)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractVariant(productName = '') {
  const text = normaliseText(productName);

  // Storage variants
  const storage = text.match(/\b(32|64|128|256|512|1024)\s*gb\b|\b[12]\s*tb\b/i)?.[0] || '';

  // RAM variants
  const ram = text.match(/\b([2-9]|1[26]|32)\s*gb\s*ram\b|\b([2-9]|1[26]|32)\s*gb\s+(?=\d+\s*gb)/i)?.[0] || '';

  // Size variants (inch, ton, kg, litre)
  const size = text.match(/\b\d+(\.\d+)?\s*(inch|in|ton|kg|litre|liter|litres|liters|l|ml|gm|gram|grams|g)\b/i)?.[0] || '';
  const packSize = text.match(/\bpack\s+of\s+\d+\b/i)?.[0] || '';

  // Color variants
  const color = text.match(/\b(black|white|blue|green|red|pink|gold|silver|grey|gray|purple|orange|yellow|violet|natural titanium|black titanium|blue titanium|white titanium|desert|midnight|starlight|coral|mint|lavender|teal|navy|charcoal|graphite|bronze|copper|rose gold)\b/i)?.[0] || '';

  // Star rating (for ACs)
  const star = text.match(/\b([1-5])\s*star\b/i)?.[0] || '';

  return normaliseText([storage, ram, size, color, star, packSize].filter(Boolean).join(' '));
}

function extractVariantComponents(productName = '') {
  const text = normaliseText(productName);
  const storage = text.match(/\b(32|64|128|256|512|1024)\s*gb\b|\b[12]\s*tb\b/i)?.[0] || '';
  const ram = text.match(/\b([2-9]|1[26]|32)\s*gb\s*ram\b|\b([2-9]|1[26]|32)\s*gb\s+(?=\d+\s*gb)/i)?.[0] || '';
  const color = text.match(/\b(black|white|blue|green|red|pink|gold|silver|grey|gray|purple|orange|yellow|violet|natural titanium|black titanium|blue titanium|white titanium|desert|midnight|starlight|coral|mint|lavender|teal|navy|charcoal|graphite|bronze|copper|rose gold)\b/i)?.[0] || '';
  const quantity = text.match(/\b\d+(\.\d+)?\s*(kg|litre|liter|litres|liters|l|ml|gm|gram|grams|g)\b/i)?.[0] || '';
  const packSize = text.match(/\bpack\s+of\s+\d+\b/i)?.[0] || '';

  return {
    variant: extractVariant(productName),
    storage: normaliseText(storage),
    ram: normaliseText(ram),
    color: normaliseText(color),
    quantity: normaliseText(quantity),
    packSize: normaliseText(packSize)
  };
}

// Strip variant tokens to get product family base name
function productFamilyKey(product) {
  const name = normaliseText(product.productName);
  const withoutVariant = name
    // Remove storage
    .replace(/\b(32|64|128|256|512|1024)\s*gb\b|\b[12]\s*tb\b/gi, ' ')
    // Remove RAM explicit labels
    .replace(/\b([2-9]|1[26]|32)\s*gb\s*ram\b/gi, ' ')
    // Remove size
    .replace(/\b\d+(\.\d+)?\s*(inch|in|ton|kg|litre|liter|litres|liters|l|ml|gm|gram|grams|g)\b/gi, ' ')
    // Remove colors
    .replace(/\b(black|white|blue|green|red|pink|gold|silver|grey|gray|purple|orange|yellow|violet|natural titanium|black titanium|blue titanium|white titanium|desert|midnight|starlight|coral|mint|lavender|teal|navy|charcoal|graphite|bronze|copper|rose gold)\b/gi, ' ')
    // Remove star ratings
    .replace(/\b[1-5]\s*star\b/gi, ' ')
    // Remove "(Pack of N)" type strings
    .replace(/\bpack\s+of\s+\d+\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Take first 8 meaningful tokens for the key
  const tokens = withoutVariant.split(' ').filter(Boolean).slice(0, 8);
  return [normaliseText(product.brand), tokens.join(' ')].filter(Boolean).join(':') || name;
}

// Token overlap similarity for cross-store matching
function tokenOverlap(nameA, nameB) {
  const tokensA = new Set(normaliseText(nameA).split(' ').filter(t => t.length > 2));
  const tokensB = new Set(normaliseText(nameB).split(' ').filter(t => t.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let shared = 0;
  tokensA.forEach(t => { if (tokensB.has(t)) shared++; });

  const minSize = Math.min(tokensA.size, tokensB.size);
  return shared / minSize;
}

function numericTokens(value) {
  return normaliseText(value)
    .split(' ')
    .filter((token) => /^\d+$/.test(token));
}

function sameNumericModel(familyA, familyB) {
  const numsA = numericTokens(familyA);
  const numsB = numericTokens(familyB);
  if (!numsA.length || !numsB.length) return true;
  return numsA.join('|') === numsB.join('|');
}

/**
 * Extract quantity/weight token from a product name for grouping guard.
 * Returns a normalised string like "1 kg", "500 ml", "250 g" or ''.
 * Products with DIFFERENT quantity tokens must NEVER be merged.
 */
function extractQuantityToken(productName) {
  const text = normaliseText(productName);
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(kg|g|gm|gram|grams|ml|l|litre|liter|litres|liters)\b/i);
  return match ? `${match[1]} ${match[2]}` : '';
}

function providerDedupKey(product) {
  return [
    normaliseText(product.platform),
    productFamilyKey(product),
    extractVariant(product.productName),
    normaliseText(product.productUrl || product.productId)
  ].join(':');
}

function storeOfferFromProduct(product) {
  const variant = extractVariantComponents(product.productName);
  return {
    platform: product.platform,
    productId: product.productId,
    productName: product.productName,
    listingPrice: product.currentPrice,
    currentPrice: product.currentPrice,
    originalPrice: product.originalPrice,
    gst: product.gst || 0,
    shipping: product.shipping || 0,
    installation: product.installation || 0,
    bankOffer: product.bankOffer || 0,
    couponDiscount: product.couponDiscount || 0,
    cashback: product.cashback || 0,
    walletOffer: product.walletOffer || 0,
    exchangeBonus: product.exchangeBonus || 0,
    emiDiscount: product.emiDiscount || 0,
    totalSavings: product.totalSavings || 0,
    finalPayablePrice: product.finalPayablePrice,
    offers: Array.isArray(product.offers) ? product.offers : [],
    rating: product.rating || 0,
    reviewCount: product.reviewCount || 0,
    availability: product.availability !== false,
    productUrl: product.productUrl,
    variant: variant.variant,
    storage: variant.storage,
    ram: variant.ram,
    color: variant.color,
    quantity: variant.quantity,
    packSize: variant.packSize,
    source: product.source,
    fetchedAt: product.fetchedAt,
    isBestDeal: false  // will be set after sorting
  };
}

function scoreOffer(offer) {
  const availabilityScore = offer.availability ? 1000000 : 0;
  const ratingScore = Number(offer.rating || 0) * 10;
  return availabilityScore - Number(offer.finalPayablePrice || Number.MAX_SAFE_INTEGER) + ratingScore;
}

function dedupeProviderProducts(products) {
  const bestByKey = new Map();

  products.forEach((product) => {
    const key = providerDedupKey(product);
    const current = bestByKey.get(key);
    if (!current || Number(product.finalPayablePrice || Infinity) < Number(current.finalPayablePrice || Infinity)) {
      bestByKey.set(key, product);
    }
  });

  return [...bestByKey.values()];
}

/**
 * Smart grouping: products with ≥70% token overlap in same price range
 * are treated as the same product across different stores.
 */
function findGroupKey(product, existingGroups) {
  const variant   = extractVariant(product.productName);
  const familyKey = productFamilyKey(product);
  const exactKey  = [familyKey, variant].filter(Boolean).join('::');

  // First: exact match
  if (existingGroups.has(exactKey)) return exactKey;

  // Quantity guard: extract quantity token from this product
  const productQuantity = extractQuantityToken(product.productName);

  // Second: fuzzy match within same brand/family
  for (const [key, group] of existingGroups) {
    // Same brand check
    const sameBrand = !product.brand || !group.brand ||
      normaliseText(product.brand) === normaliseText(group.brand);

    // Same variant check
    const groupVariant = group.variantKey || extractVariant(group.productName);
    const sameVariant  = variant === groupVariant;

    // QUANTITY GUARD: if both products have a quantity token, they must match exactly.
    // This prevents 500g dates from being grouped with 1kg dates.
    if (productQuantity) {
      const groupQuantity = extractQuantityToken(group.productName);
      if (groupQuantity && groupQuantity !== productQuantity) continue;
    }

    if (sameBrand && sameVariant) {
      if (!sameNumericModel(familyKey, group.familyKey || group.productKey)) continue;

      const overlap = tokenOverlap(product.productName, group.productName);
      if (overlap >= 0.70) {
        return key;
      }
    }
  }

  return exactKey;
}

function groupProducts(products) {
  const groups = new Map();

  dedupeProviderProducts(products).forEach((product) => {
    const familyKey = productFamilyKey(product);
    const variantComponents = extractVariantComponents(product.productName);
    const variantKey = variantComponents.variant;
    const key = findGroupKey(product, groups);
    const existing = groups.get(key) || {
      productKey: key,
      familyKey,
      variantKey,
      productName: product.productName,
      brand: product.brand || '',
      category: product.category || '',
      variant: variantKey,
      storage: variantComponents.storage,
      ram: variantComponents.ram,
      color: variantComponents.color,
      quantity: variantComponents.quantity,
      packSize: variantComponents.packSize,
      image: product.image,
      stores: []
    };

    existing.stores.push(storeOfferFromProduct(product));
    if (!existing.image && product.image) existing.image = product.image;

    // Keep the longest product name (most descriptive)
    if (product.productName && product.productName.length > (existing.productName || '').length) {
      existing.productName = product.productName;
    }

    groups.set(key, existing);
  });

  return [...groups.values()].map((group) => {
    // Sort stores by finalPayablePrice ascending (cheapest first)
    group.stores.sort((a, b) => {
      const aPrice = Number(a.finalPayablePrice || Infinity);
      const bPrice = Number(b.finalPayablePrice || Infinity);
      if (a.availability !== b.availability) return b.availability ? 1 : -1;
      return aPrice - bPrice;
    });

    // Mark best deal
    if (group.stores.length > 0) {
      group.stores[0].isBestDeal = true;
    }

    group.bestDeal = group.stores[0] || null;
    group.bestStore = group.bestDeal ? group.bestDeal.platform : null;
    group.storeCount = group.stores.length;
    group.lowestFinalPrice = group.bestDeal ? group.bestDeal.finalPayablePrice : 0;
    group.highestRating = Math.max(0, ...group.stores.map((store) => Number(store.rating) || 0));
    group.totalOffers = group.stores.reduce((sum, store) => sum + (store.offers || []).length, 0);
    group.dealScore = group.bestDeal ? scoreOffer(group.bestDeal) + group.storeCount * 100 + group.totalOffers * 10 : 0;
    return group;
  }).sort((a, b) => b.dealScore - a.dealScore);
}

module.exports = {
  groupProducts,
  dedupeProviderProducts,
  productFamilyKey,
  extractVariant,
  extractVariantComponents
};
