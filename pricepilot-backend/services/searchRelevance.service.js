/**
 * @module searchRelevance.service
 * @description Scores scraped products against parsed search intent.
 *
 * Phase 3 upgrades:
 *  - Dynamic MAIN_THRESHOLD based on searchMode (not a single hard number):
 *      'exact'    → 65  (brand + model + variant: strict filtering)
 *      'branded'  → 40  (brand + product type: moderate)
 *      'generic'  → 15  (product type only: permissive)
 *      'category' → 0   (all products pass)
 *  - productCore scoring: +20 if product name contains the core noun
 *  - negativeBrandPenalty disabled for generic/category searches
 *  - tokenOverlapScore now uses productCore tokens for better generic matching
 *  - relatedProducts threshold scales with main threshold
 *
 * Architecture note:
 *   All threshold constants are named and documented here.
 *   Changing search sensitivity = editing only this file.
 */

const { normalizeText, parseSearchIntent } = require('./searchIntent.service');

// ─── Mode-based thresholds ────────────────────────────────────────────────────
// Lower threshold = more permissive (more results shown)
// Higher threshold = stricter (only exact matches shown)

const THRESHOLDS = {
  exact:    65,   // iPhone 16 Pro Max 256GB → strict
  branded:  40,   // Nike Shoes / Cetaphil Cleanser → moderate
  generic:  15,   // keyboard / cleanser / 1kg dates → permissive
  category: 0     // electronics / beauty → all pass
};

const RELATED_THRESHOLD_RATIO = 0.55; // related = 55% of main threshold

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasTerm(text, term) {
  if (!term) return false;
  const normalized = normalizeText(term);
  return new RegExp(`(^|\\s)${escapeRegex(normalized)}(\\s|$)`, 'i').test(text);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Token overlap score — how many query tokens appear in the product text.
 * Uses the full token list but skips trivial tokens (< 3 chars, non-numeric).
 */
function tokenOverlapScore(queryTokens, productText) {
  const relevant = queryTokens.filter((token) => token.length > 2 || /^\d+$/.test(token));
  if (!relevant.length) return 0;
  const matched = relevant.filter((token) => hasTerm(productText, token)).length;
  return Math.round((matched / relevant.length) * 20);
}

/**
 * productCore score — check if the product name contains the core product noun.
 * This is the primary relevance signal for generic searches.
 *
 * Examples:
 *   query "1kg dates" → productCore "dates" → product "Happilo Premium Medjool Dates 1kg" → +20
 *   query "cleanser"  → productCore "cleanser" → product "Cetaphil Gentle Skin Cleanser" → +20
 */
function productCoreScore(productCore, productText) {
  if (!productCore || !productCore.trim()) return 0;

  const coreTokens = normalizeText(productCore).split(' ').filter((t) => t.length > 2);
  if (!coreTokens.length) return 0;

  const matched = coreTokens.filter((token) => hasTerm(productText, token)).length;
  const ratio = matched / coreTokens.length;

  if (ratio === 1) return 20;      // All core tokens found
  if (ratio >= 0.5) return 10;     // At least half found
  return 0;
}

/**
 * Penalise products from the wrong brand — but ONLY for branded/exact searches.
 * For generic/category searches, no brand penalty is applied.
 */
function negativeBrandPenalty(intent, product, searchMode) {
  // Never penalise on generic/category searches — we want all products
  if (!intent.brand || searchMode === 'generic' || searchMode === 'category') return 0;

  const productBrand = normalizeText(product.brand);
  const productText  = normalizeText(`${product.brand || ''} ${product.productName || product.title || ''}`);
  const intentBrand  = normalizeText(intent.brand);

  if (productBrand && productBrand !== intentBrand) return -45;
  if (!productBrand && !hasTerm(productText, intentBrand)) return -20;
  return 0;
}

// ─── Core scoring ─────────────────────────────────────────────────────────────

function scoreProductRelevance(product, intentInput) {
  const intent     = typeof intentInput === 'string' ? parseSearchIntent(intentInput) : intentInput;
  const searchMode = intent.searchMode || 'generic';
  const name       = product.productName || product.title || '';
  const productText = normalizeText(`${product.brand || ''} ${name} ${product.category || ''}`);
  let score        = 0;
  const reasons    = [];

  // ── Brand match ──────────────────────────────────────────────────────────
  if (intent.brand && hasTerm(productText, intent.brand)) {
    score += 30;
    reasons.push('brand');
  }

  // ── Family match ─────────────────────────────────────────────────────────
  if (intent.family && hasTerm(productText, intent.family)) {
    score += 25;
    reasons.push('family');
  }

  // ── Model match ──────────────────────────────────────────────────────────
  if (intent.model) {
    const modelTokens  = normalizeText(intent.model).split(' ').filter(Boolean);
    const modelMatches = modelTokens.filter((token) => hasTerm(productText, token)).length;
    if (modelTokens.length && modelMatches === modelTokens.length) {
      score += 25;
      reasons.push('model');
    } else if (modelMatches > 0) {
      score += 10;
      reasons.push('partial-model');
    } else if (modelTokens.some((token) => /^\d+$/.test(token))) {
      // Only penalise model mismatch in exact mode
      if (searchMode === 'exact') {
        score -= 25;
        reasons.push('model-missing');
      }
    }
  }

  // ── Variant match ────────────────────────────────────────────────────────
  if (intent.variant && (searchMode === 'exact' || searchMode === 'branded')) {
    const variantTokens  = normalizeText(intent.variant).split(' ').filter(Boolean);
    const variantMatches = variantTokens.filter((token) => hasTerm(productText, token)).length;
    if (variantTokens.length && variantMatches === variantTokens.length) {
      score += 12;
      reasons.push('variant');
    } else if (variantTokens.length > 0 && searchMode === 'exact') {
      score -= 10;
      reasons.push('variant-mismatch');
    }
  }

  // ── Quantity match (critical for groceries) ──────────────────────────────
  if (intent.quantity && hasTerm(productText, intent.quantity)) {
    score += 15;
    reasons.push('quantity');
  } else if (intent.quantity && !hasTerm(productText, intent.quantity)) {
    // If user specified a quantity but product has a different one, mild penalty
    // (don't penalise hard since stores might show 1kg as "1000g" etc.)
    score -= 5;
    reasons.push('quantity-mismatch');
  }

  // ── Category match ───────────────────────────────────────────────────────
  if (intent.category && intent.category !== 'general') {
    if (normalizeText(product.category) === normalizeText(intent.category)) {
      score += 8;
      reasons.push('category');
    } else if (product.category) {
      score -= 10;
      reasons.push('category-mismatch');
    }
  }

  // ── Product type match ───────────────────────────────────────────────────
  if (intent.productType && hasTerm(productText, intent.productType.replace(/_/g, ' '))) {
    score += 8;
    reasons.push('type');
  }

  // ── Product core match (KEY for generic searches) ────────────────────────
  const coreBonus = productCoreScore(intent.productCore, productText);
  if (coreBonus > 0) {
    score += coreBonus;
    reasons.push('core');
  }

  // ── Token overlap ────────────────────────────────────────────────────────
  score += tokenOverlapScore(intent.tokens || [], productText);

  // ── Brand penalty (mode-aware) ───────────────────────────────────────────
  score += negativeBrandPenalty(intent, product, searchMode);

  return {
    ...product,
    relevanceScore:   Math.max(0, Math.min(100, Math.round(score))),
    relevanceReasons: reasons
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Score all products and split into main / related buckets.
 *
 * Key change (Phase 3):
 *   Thresholds are now dynamic based on intent.searchMode, not a fixed 72.
 *   This ensures generic searches ("keyboard", "cleanser", "1kg dates") always
 *   return results instead of filtering everything out.
 */
function applySearchRelevance(products, intentInput) {
  const intent     = typeof intentInput === 'string' ? parseSearchIntent(intentInput) : intentInput;
  const searchMode = intent.searchMode || 'generic';

  const scoredProducts = products
    .map((product) => scoreProductRelevance(product, intent))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  // For category-mode or when there's no specific intent, pass everything through
  const hasSpecificIntent = Boolean(intent.brand || intent.family || intent.model || intent.productType || intent.productCore);
  if (!hasSpecificIntent || searchMode === 'category') {
    return {
      mainProducts:    scoredProducts,
      relatedProducts: [],
      scoredProducts,
      searchMode,
      mainThreshold:   0
    };
  }

  const mainThreshold    = THRESHOLDS[searchMode] ?? THRESHOLDS.generic;
  const relatedThreshold = Math.round(mainThreshold * RELATED_THRESHOLD_RATIO);

  return {
    mainProducts: scoredProducts.filter((product) => product.relevanceScore >= mainThreshold),
    relatedProducts: scoredProducts.filter((product) =>
      product.relevanceScore >= relatedThreshold &&
      product.relevanceScore < mainThreshold
    ).slice(0, 12),
    scoredProducts,
    searchMode,
    mainThreshold
  };
}

module.exports = {
  THRESHOLDS,
  RELATED_THRESHOLD_RATIO,
  scoreProductRelevance,
  applySearchRelevance
};
