const logger = require('../utils/logger');

function createRedisClient() {
  logger.info('Redis client not configured. Using in-memory cache for Week 3 phase.');
  return null;
}

module.exports = createRedisClient;
