/**
 * @module providerRegistry
 * @description Central registry for all platform providers.
 *
 * Responsibilities:
 *  - Register providers at startup
 *  - Enable / disable providers at runtime
 *  - Return provider instances by name
 *  - Validate that every provider exposes the required interface
 *
 * The registry reads provider configuration from config/providers.js so
 * controllers never need to know which providers are active.
 */

const providerConfig = require('../config/providers');
const logger = require('../utils/logger');

/** @type {Map<string, object>} */
const registry = new Map();

/**
 * Validate that a provider implements the required interface.
 *
 * @param {string} name - Provider key (e.g. 'amazon')
 * @param {object} provider - Provider instance
 * @throws {Error} if the interface is not satisfied
 */
function validateInterface(name, provider) {
  if (typeof provider.searchProducts !== 'function') {
    throw new Error(`Provider "${name}" must expose a searchProducts(query) function.`);
  }
  if (!provider.platform) {
    throw new Error(`Provider "${name}" must expose a platform string.`);
  }
}

/**
 * Register a provider in the registry.
 *
 * @param {string} name - Canonical provider key
 * @param {object} provider - Provider instance
 */
function register(name, provider) {
  validateInterface(name, provider);

  const config = providerConfig[name] || {};
  const enabled = config.enabled !== false;

  registry.set(name, {
    instance: provider,
    enabled,
    config: {
      strategy: config.strategy || 'mock',
      priority: config.priority || 99,
      timeout: config.timeout || 5000,
      retries: config.retries !== undefined ? config.retries : 2
    },
    health: {
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTimeMs: 0,
      lastChecked: null,
      lastError: null
    }
  });

  logger.info('Provider Registered', { name, enabled, strategy: config.strategy || 'mock' });
}

/**
 * Enable a registered provider.
 *
 * @param {string} name - Provider key
 */
function enable(name) {
  const entry = registry.get(name);
  if (!entry) throw new Error(`Provider "${name}" is not registered.`);
  entry.enabled = true;
  logger.info('Provider Enabled', { name });
}

/**
 * Disable a registered provider.
 *
 * @param {string} name - Provider key
 */
function disable(name) {
  const entry = registry.get(name);
  if (!entry) throw new Error(`Provider "${name}" is not registered.`);
  entry.enabled = false;
  logger.info('Provider Disabled', { name });
}

/**
 * Return the provider instance for a given name.
 *
 * @param {string} name - Provider key
 * @returns {object} provider instance
 * @throws {Error} if the provider is not found or disabled
 */
function get(name) {
  const entry = registry.get(name);
  if (!entry) throw new Error(`Provider "${name}" is not registered.`);
  if (!entry.enabled) throw new Error(`Provider "${name}" is disabled.`);
  return entry.instance;
}

/**
 * Return all enabled providers ordered by priority.
 *
 * @returns {Array<{name: string, instance: object, config: object}>}
 */
function getEnabledProviders() {
  return [...registry.entries()]
    .filter(([, entry]) => entry.enabled)
    .sort(([, a], [, b]) => a.config.priority - b.config.priority)
    .map(([name, entry]) => ({
      name,
      instance: entry.instance,
      config: entry.config
    }));
}

/**
 * Record a successful request for health tracking.
 *
 * @param {string} name - Provider key
 * @param {number} responseTimeMs - How long the request took
 */
function recordSuccess(name, responseTimeMs) {
  const entry = registry.get(name);
  if (!entry) return;
  entry.health.successfulRequests += 1;
  entry.health.totalResponseTimeMs += responseTimeMs;
  entry.health.lastChecked = new Date();
}

/**
 * Record a failed request for health tracking.
 *
 * @param {string} name - Provider key
 * @param {string} errorMessage - Error description
 */
function recordFailure(name, errorMessage) {
  const entry = registry.get(name);
  if (!entry) return;
  entry.health.failedRequests += 1;
  entry.health.lastError = errorMessage;
  entry.health.lastChecked = new Date();
}

/**
 * Return health snapshot for all registered providers.
 *
 * @returns {Array<object>}
 */
function getHealthReport() {
  return [...registry.entries()].map(([name, entry]) => {
    const { health, config, enabled } = entry;
    const total = health.successfulRequests + health.failedRequests;
    const averageResponseTime = total > 0
      ? Math.round(health.totalResponseTimeMs / health.successfulRequests || 0)
      : 0;

    const status = !enabled
      ? 'Disabled'
      : health.failedRequests === 0
        ? 'Healthy'
        : health.successfulRequests === 0
          ? 'Unhealthy'
          : 'Degraded';

    return {
      provider: name,
      status,
      strategy: config.strategy,
      priority: config.priority,
      enabled,
      averageResponseTime,
      successfulRequests: health.successfulRequests,
      failedRequests: health.failedRequests,
      totalRequests: total,
      lastError: health.lastError,
      lastChecked: health.lastChecked
    };
  });
}

/**
 * Check whether a provider name is registered and enabled.
 *
 * @param {string} name - Provider key
 * @returns {boolean}
 */
function isRegistered(name) {
  const entry = registry.get(name);
  return Boolean(entry && entry.enabled);
}

module.exports = {
  register,
  enable,
  disable,
  get,
  getEnabledProviders,
  recordSuccess,
  recordFailure,
  getHealthReport,
  isRegistered
};
