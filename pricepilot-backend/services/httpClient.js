const axios = require('axios');
const { DEFAULT_TIMEOUT } = require('../config/constants');
const logger = require('../utils/logger');
const { retry } = require('../utils/retry');

const client = axios.create({
  timeout: DEFAULT_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'User-Agent': 'PricePilot/1.0 provider-framework'
  }
});

async function request(config, options = {}) {
  const startedAt = Date.now();
  const method = (config.method || 'GET').toUpperCase();

  logger.info('HTTP Request Started', { method, url: config.url });

  return retry(async () => {
    try {
      const response = await client.request({
        ...config,
        timeout: config.timeout || options.timeout || DEFAULT_TIMEOUT
      });

      logger.info('HTTP Response Received', {
        method,
        url: config.url,
        status: response.status,
        responseTimeMs: Date.now() - startedAt
      });

      return response;
    } catch (error) {
      logger.error('HTTP Request Failed', {
        method,
        url: config.url,
        status: error.response && error.response.status,
        responseTimeMs: Date.now() - startedAt,
        error: error.message
      });
      throw error;
    }
  }, {
    retries: options.retries,
    delayMs: options.delayMs,
    label: `http:${method}:${config.url}`
  });
}

module.exports = {
  client,
  request,
  get: (url, options = {}) => request({ url, method: 'GET', ...options }, options),
  post: (url, data, options = {}) => request({ url, method: 'POST', data, ...options }, options)
};
