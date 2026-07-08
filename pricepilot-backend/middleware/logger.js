/**
 * @module httpLogger
 * @description Express request-logging middleware.
 *
 * Emits a structured JSON log entry (via utils/logger) for every HTTP
 * request after the response finishes. Keeps all application log output
 * in the same parseable JSON format produced by utils/logger.
 */

const appLogger = require('../utils/logger');

/**
 * Log every incoming HTTP request as a structured JSON entry.
 *
 * Fields logged:
 *  - method    – HTTP verb
 *  - url       – original request URL (includes query string)
 *  - status    – HTTP response status code
 *  - durationMs – wall-clock response time
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function httpLogger(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    appLogger[level]('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs
    });
  });

  next();
}

module.exports = httpLogger;

