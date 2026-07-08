/**
 * @module browser
 * @description Browser configuration for Playwright automation.
 *
 * All browser settings are sourced from environment variables so
 * behaviour can be changed without touching provider code.
 */

const { booleanEnv, numberEnv, stringEnv } = require('./env');

/**
 * @typedef {object} BrowserConfig
 * @property {boolean} headless       - Run in headless mode (no visible window)
 * @property {number}  slowMo         - Slow down Playwright operations by N ms
 * @property {number}  timeout        - Default navigation timeout in ms
 * @property {number}  maxConcurrent  - Max simultaneous browser instances
 * @property {number}  maxPages       - Max simultaneous pages across all contexts
 * @property {number}  queueTimeout   - Max ms to wait for a free page slot
 * @property {object}  viewport       - Default page viewport
 * @property {string}  userAgent      - Default User-Agent string
 */

/** @type {BrowserConfig} */
const browserConfig = {
  headless:      booleanEnv('BROWSER_HEADLESS', true),
  slowMo:        numberEnv('BROWSER_SLOW_MO', 0),
  timeout:       numberEnv('BROWSER_TIMEOUT', 30000),
  maxConcurrent: numberEnv('BROWSER_MAX_CONCURRENT', 2),
  maxPages:      numberEnv('BROWSER_MAX_PAGES', 5),
  queueTimeout:  numberEnv('BROWSER_QUEUE_TIMEOUT', 60000),
  viewport: {
    width:  numberEnv('BROWSER_VIEWPORT_WIDTH', 1280),
    height: numberEnv('BROWSER_VIEWPORT_HEIGHT', 800)
  },
  userAgent: stringEnv(
    'BROWSER_USER_AGENT',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  )
};

module.exports = browserConfig;
