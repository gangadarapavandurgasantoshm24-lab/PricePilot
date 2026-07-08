const { numberEnv, stringEnv } = require('./env');

const CACHE_TTL_SECONDS = numberEnv('CACHE_TTL', numberEnv('CACHE_TTL_SECONDS', 30 * 60));
const DEFAULT_TIMEOUT = numberEnv('DEFAULT_TIMEOUT', numberEnv('PROVIDER_TIMEOUT_MS', 5000));
const RETRY_COUNT = numberEnv('RETRY_COUNT', numberEnv('PROVIDER_RETRY_COUNT', 2));
const MAX_RESULTS = numberEnv('MAX_RESULTS', 100);
const LOG_LEVEL = stringEnv('LOG_LEVEL', 'info');
const PORT = numberEnv('PORT', 5000);

const SUPPORTED_PLATFORMS = [
  'amazon',
  'flipkart',
  'nykaa',
  'apollo',
  'pharmeasy',
  'tata1mg',
  'myntra',
  'ajio',
  'reliancedigital',
  'croma'
];

module.exports = {
  CACHE_TTL_SECONDS,
  DEFAULT_TIMEOUT,
  RETRY_COUNT,
  MAX_RESULTS,
  LOG_LEVEL,
  PORT,
  SUPPORTED_PLATFORMS
};
