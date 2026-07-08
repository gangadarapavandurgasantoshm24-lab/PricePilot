/**
 * @module calculateFinalPrice
 * @description Thin re-export shim for backward compatibility.
 *
 * The canonical implementation lives in services/pricing.service.js.
 * All new code should import from there directly.
 *
 * @deprecated Import { calculateFinalPrice } from '../services/pricing.service' instead.
 */

const { calculateFinalPrice } = require('../services/pricing.service');

module.exports = calculateFinalPrice;

