/**
 * Unit tests – Pricing Service
 * @file tests/pricingService.test.js
 */

const { calculateFinalPrice } = require('../services/pricing.service');

describe('calculateFinalPrice', () => {
  it('returns currentPrice when no additions or deductions', () => {
    expect(calculateFinalPrice({ currentPrice: 1000 })).toBe(1000);
  });

  it('adds GST to the base price', () => {
    expect(calculateFinalPrice({ currentPrice: 1000, gst: 180 })).toBe(1180);
  });

  it('adds shipping charge', () => {
    expect(calculateFinalPrice({ currentPrice: 1000, shipping: 99 })).toBe(1099);
  });

  it('deducts bank offer', () => {
    expect(calculateFinalPrice({ currentPrice: 1000, bankOffer: 200 })).toBe(800);
  });

  it('deducts coupon discount', () => {
    expect(calculateFinalPrice({ currentPrice: 1000, couponDiscount: 150 })).toBe(850);
  });

  it('applies complete formula: price + gst + shipping - bankOffer - coupon', () => {
    expect(
      calculateFinalPrice({
        currentPrice: 50000,
        gst: 9000,
        shipping: 0,
        bankOffer: 5000,
        couponDiscount: 2000
      })
    ).toBe(52000);
  });

  it('deducts cashback', () => {
    expect(calculateFinalPrice({ currentPrice: 1000, cashback: 100 })).toBe(900);
  });

  it('deducts wallet offer', () => {
    expect(calculateFinalPrice({ currentPrice: 1000, walletOffer: 50 })).toBe(950);
  });

  it('deducts exchange bonus', () => {
    expect(calculateFinalPrice({ currentPrice: 1000, exchangeBonus: 200 })).toBe(800);
  });

  it('deducts EMI discount', () => {
    expect(calculateFinalPrice({ currentPrice: 1000, emiDiscount: 100 })).toBe(900);
  });

  it('never returns a negative final price', () => {
    expect(
      calculateFinalPrice({ currentPrice: 100, bankOffer: 500, couponDiscount: 500 })
    ).toBe(0);
  });

  it('accepts price field as an alias for currentPrice', () => {
    expect(calculateFinalPrice({ price: 2000 })).toBe(2000);
  });
});
