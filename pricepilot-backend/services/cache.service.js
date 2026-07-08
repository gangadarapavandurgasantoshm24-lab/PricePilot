const { CACHE_TTL_SECONDS } = require('../config/constants');
const logger = require('../utils/logger');

const memoryCache = new Map();

function getCacheKey(prefix, value) {
  return `${prefix}:${String(value || '').trim().toLowerCase()}`;
}

async function get(key) {
  const cached = memoryCache.get(key);

  if (!cached) {
    logger.info('Cache Miss', { key });
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    memoryCache.delete(key);
    logger.info('Cache Expired', { key });
    return null;
  }

  logger.info('Cache Hit', { key });
  return cached.value;
}

async function set(key, value, ttlSeconds = CACHE_TTL_SECONDS) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

async function clear() {
  memoryCache.clear();
}

module.exports = {
  get,
  set,
  clear,
  getCacheKey
};
