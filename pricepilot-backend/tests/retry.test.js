/**
 * Unit tests – Retry Utility
 * @file utils/retry.test.js
 */

const { retry, isRetryableError } = require('../utils/retry');

describe('isRetryableError', () => {
  it('returns true when there is no HTTP status (network error)', () => {
    expect(isRetryableError(new Error('network error'))).toBe(true);
  });

  it('returns true for 408 Request Timeout', () => {
    const err = { response: { status: 408 } };
    expect(isRetryableError(err)).toBe(true);
  });

  it('returns true for 429 Too Many Requests', () => {
    const err = { response: { status: 429 } };
    expect(isRetryableError(err)).toBe(true);
  });

  it('returns true for 503 Service Unavailable', () => {
    const err = { response: { status: 503 } };
    expect(isRetryableError(err)).toBe(true);
  });

  it('returns false for 404 Not Found', () => {
    const err = { response: { status: 404 } };
    expect(isRetryableError(err)).toBe(false);
  });

  it('returns false for 400 Bad Request', () => {
    const err = { response: { status: 400 } };
    expect(isRetryableError(err)).toBe(false);
  });
});

describe('retry', () => {
  it('resolves on first attempt when operation succeeds', async () => {
    const op = jest.fn().mockResolvedValue('ok');
    const result = await retry(op, { retries: 2, delayMs: 0 });
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries and resolves when operation eventually succeeds', async () => {
    let calls = 0;
    const op = jest.fn().mockImplementation(() => {
      calls += 1;
      if (calls < 3) throw Object.assign(new Error('fail'), {});
      return Promise.resolve('success');
    });

    const result = await retry(op, { retries: 3, delayMs: 0 });
    expect(result).toBe('success');
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all retries', async () => {
    const op = jest.fn().mockRejectedValue(new Error('always fails'));
    await expect(retry(op, { retries: 2, delayMs: 0 })).rejects.toThrow('always fails');
    expect(op).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('does not retry non-retryable errors', async () => {
    const err = Object.assign(new Error('bad request'), { response: { status: 400 } });
    const op = jest.fn().mockRejectedValue(err);
    await expect(retry(op, { retries: 3, delayMs: 0 })).rejects.toThrow('bad request');
    expect(op).toHaveBeenCalledTimes(1);
  });
});
