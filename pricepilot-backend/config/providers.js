/**
 * @module config/providers
 * @description Provider configuration for all 15 platforms.
 *
 * Phase 2 changes:
 *  - timeout increased to 25000ms for real Playwright scraping
 *  - retries increased to 2 for resilience against transient failures
 *
 * Strategy values:
 *   'mock'          → Mock provider (always works, demo data)
 *   'official-api'  → Real API (amazon PA API v5)
 *   'playwright'    → Playwright browser automation with mock fallback
 *
 * To change any provider's strategy, edit ONLY this file.
 */

const { numberEnv } = require('./env');

const defaultTimeout = numberEnv('DEFAULT_TIMEOUT', 25000);
const defaultRetries = numberEnv('RETRY_COUNT', 2);

const providers = {
  amazon:          { enabled: true, strategy: 'playwright',   priority: 1,  timeout: defaultTimeout, retries: defaultRetries },
  flipkart:        { enabled: true, strategy: 'playwright',   priority: 2,  timeout: defaultTimeout, retries: defaultRetries },
  myntra:          { enabled: true, strategy: 'playwright',   priority: 3,  timeout: defaultTimeout, retries: defaultRetries },
  ajio:            { enabled: true, strategy: 'playwright',   priority: 4,  timeout: defaultTimeout, retries: defaultRetries },
  meesho:          { enabled: true, strategy: 'playwright',   priority: 5,  timeout: defaultTimeout, retries: defaultRetries },
  nykaa:           { enabled: true, strategy: 'playwright',   priority: 6,  timeout: defaultTimeout, retries: defaultRetries },
  purplle:         { enabled: true, strategy: 'playwright',   priority: 7,  timeout: defaultTimeout, retries: defaultRetries },
  tira:            { enabled: true, strategy: 'playwright',   priority: 8,  timeout: defaultTimeout, retries: defaultRetries },
  apollo:          { enabled: true, strategy: 'playwright',   priority: 9,  timeout: defaultTimeout, retries: defaultRetries },
  pharmeasy:       { enabled: true, strategy: 'playwright',   priority: 10, timeout: defaultTimeout, retries: defaultRetries },
  tata1mg:         { enabled: true, strategy: 'playwright',   priority: 11, timeout: defaultTimeout, retries: defaultRetries },
  netmeds:         { enabled: true, strategy: 'playwright',   priority: 12, timeout: defaultTimeout, retries: defaultRetries },
  bigbasket:       { enabled: true, strategy: 'playwright',   priority: 13, timeout: defaultTimeout, retries: defaultRetries },
  blinkit:         { enabled: true, strategy: 'playwright',   priority: 14, timeout: defaultTimeout, retries: defaultRetries },
  zepto:           { enabled: true, strategy: 'playwright',   priority: 15, timeout: defaultTimeout, retries: defaultRetries },
  jiomart:         { enabled: true, strategy: 'playwright',   priority: 16, timeout: defaultTimeout, retries: defaultRetries },
  reliancedigital: { enabled: true, strategy: 'playwright',   priority: 17, timeout: defaultTimeout, retries: defaultRetries },
  croma:           { enabled: true, strategy: 'playwright',   priority: 18, timeout: defaultTimeout, retries: defaultRetries },
  vijaysales:      { enabled: true, strategy: 'playwright',   priority: 19, timeout: defaultTimeout, retries: defaultRetries }
};

module.exports = providers;
