/**
 * @module config/providers
 * @description Provider configuration for all 12 platforms.
 *
 * Week 6 changes:
 *  - myntra: strategy changed to 'playwright'
 *  - purplle: NEW platform (beauty, strategy: 'playwright')
 *  - meesho:  NEW platform (fashion/home/general, strategy: 'playwright')
 *
 * Strategy values:
 *   'mock'          → Mock provider (always works, demo data)
 *   'official-api'  → Real API (amazon PA API v5)
 *   'playwright'    → Playwright browser automation with mock fallback
 *
 * To change any provider's strategy, edit ONLY this file.
 */

const { numberEnv } = require('./env');

const defaultTimeout = numberEnv('DEFAULT_TIMEOUT', 5000);
const defaultRetries = numberEnv('RETRY_COUNT', 2);

const providers = {
  amazon:          { enabled: true, strategy: 'official-api', priority: 1,  timeout: defaultTimeout, retries: defaultRetries },
  flipkart:        { enabled: true, strategy: 'mock',         priority: 2,  timeout: defaultTimeout, retries: defaultRetries },
  myntra:          { enabled: true, strategy: 'playwright',   priority: 3,  timeout: 15000,          retries: 1 },
  ajio:            { enabled: true, strategy: 'mock',         priority: 4,  timeout: defaultTimeout, retries: defaultRetries },
  meesho:          { enabled: true, strategy: 'playwright',   priority: 5,  timeout: 15000,          retries: 1 },
  nykaa:           { enabled: true, strategy: 'mock',         priority: 6,  timeout: defaultTimeout, retries: defaultRetries },
  purplle:         { enabled: true, strategy: 'playwright',   priority: 7,  timeout: 15000,          retries: 1 },
  apollo:          { enabled: true, strategy: 'mock',         priority: 8,  timeout: defaultTimeout, retries: defaultRetries },
  pharmeasy:       { enabled: true, strategy: 'mock',         priority: 9,  timeout: defaultTimeout, retries: defaultRetries },
  tata1mg:         { enabled: true, strategy: 'mock',         priority: 10, timeout: defaultTimeout, retries: defaultRetries },
  reliancedigital: { enabled: true, strategy: 'mock',         priority: 11, timeout: defaultTimeout, retries: defaultRetries },
  croma:           { enabled: true, strategy: 'mock',         priority: 12, timeout: defaultTimeout, retries: defaultRetries }
};

module.exports = providers;
