const logger = require('./logger');

function isRetryableError(error) {
  const status = error.response && error.response.status;
  return !status || status === 408 || status === 429 || status >= 500;
}

async function retry(operation, options = {}) {
  const {
    retries = 2,
    delayMs = 250,
    factor = 2,
    shouldRetry = isRetryableError,
    label = 'operation'
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation(attempt + 1);
    } catch (error) {
      lastError = error;

      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }

      const waitMs = delayMs * Math.pow(factor, attempt);
      logger.warn('Retry Attempt', {
        label,
        attempt: attempt + 1,
        nextAttempt: attempt + 2,
        waitMs,
        error: error.message
      });

      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}

module.exports = {
  retry,
  isRetryableError
};
