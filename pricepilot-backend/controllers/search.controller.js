const platformManager = require('../services/platformManager');
const { getSearchSuggestions, parseSearchIntent } = require('../services/searchIntent.service');
const { numberEnv } = require('../config/env');

const DEFAULT_PAGE  = numberEnv('DEFAULT_PAGE',  1);
const DEFAULT_LIMIT = numberEnv('DEFAULT_LIMIT', 20);
const MAX_LIMIT     = numberEnv('MAX_LIMIT',    100);

function getSearchOptions(query) {
  const page  = Math.max(1, parseInt(query.page,  10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));

  return {
    sortBy:       query.sortBy,
    brand:        query.brand,
    minPrice:     query.minPrice,
    maxPrice:     query.maxPrice,
    minRating:    query.minRating,
    availability: query.availability,
    category:     query.category ? String(query.category).trim().toLowerCase() : undefined,
    minDiscount:  query.minDiscount,
    platform:     query.platform,
    page,
    limit
  };
}

async function searchProducts(req, res, next) {
  try {
    const searchQuery = req.query.q || '';

    if (!searchQuery.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required. Use /api/search?q=laptop'
      });
    }

    const options = getSearchOptions(req.query);
    const result  = await platformManager.searchAllPlatforms(searchQuery, options);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function searchPlatform(req, res, next) {
  try {
    const searchQuery = req.query.q || '';
    const platform = req.params.platform;

    if (!platformManager.isSupportedPlatform(platform)) {
      return res.status(404).json({
        success: false,
        message: `Unsupported platform: ${platform}`,
        supportedPlatforms: platformManager.supportedPlatforms
      });
    }

    if (!searchQuery.trim()) {
      return res.status(400).json({
        success: false,
        message: `Search query is required. Use /api/platform/${platform}?q=laptop`
      });
    }

    const result = await platformManager.searchPlatform(platform, searchQuery, getSearchOptions(req.query));
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

function getSupportedPlatforms(req, res) {
  return res.json({
    success: true,
    platforms: platformManager.supportedPlatforms
  });
}

function getSuggestions(req, res) {
  const query = String(req.query.q || '').trim();
  return res.json({
    success: true,
    query,
    intent: query ? parseSearchIntent(query) : null,
    suggestions: getSearchSuggestions(query)
  });
}

module.exports = {
  searchProducts,
  searchPlatform,
  getSupportedPlatforms,
  getSuggestions
};
