/**
 * Unit tests – HTTP Client
 * @file tests/httpClient.test.js
 *
 * Tests verify that:
 *  - Successful requests return the response
 *  - Failed requests are retried up to the configured limit
 *  - Non-retryable errors (4xx) are NOT retried
 *  - get() and post() convenience helpers call request() correctly
 *
 * Axios is mocked so no real network I/O occurs.
 * The mock is declared at the top level so Jest hoists it before any require().
 */

// ─── Mock the axios instance that httpClient creates ─────────────────────────

const mockAxiosRequest = jest.fn();

jest.mock('axios', () => ({
  create: () => ({ request: mockAxiosRequest })
}));

// Require after the mock factory is set up
const httpClient = require('../services/httpClient');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNetworkError(message = 'Network Error') {
  return new Error(message);
}

function makeHttpError(status, message) {
  return Object.assign(new Error(message), { response: { status } });
}

// Reset mock call state before each test
beforeEach(() => {
  mockAxiosRequest.mockReset();
});

// ─── httpClient.request ───────────────────────────────────────────────────────

describe('httpClient.request', () => {
  it('resolves with the axios response on success', async () => {
    const fakeResponse = { status: 200, data: { ok: true } };
    mockAxiosRequest.mockResolvedValue(fakeResponse);

    const result = await httpClient.request({ url: 'https://example.com', method: 'GET' });

    expect(result).toBe(fakeResponse);
    expect(mockAxiosRequest).toHaveBeenCalledTimes(1);
  });

  it('retries on network errors and eventually resolves', async () => {
    const networkError = makeNetworkError();
    const successResponse = { status: 200, data: {} };

    // Fail twice, then succeed on the 3rd attempt
    mockAxiosRequest
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue(successResponse);

    const result = await httpClient.request(
      { url: 'https://example.com', method: 'GET' },
      { retries: 2, delayMs: 0 }
    );

    expect(result).toBe(successResponse);
    // 1 initial + 2 retries = 3 total calls
    expect(mockAxiosRequest).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all retries on persistent network errors', async () => {
    mockAxiosRequest.mockRejectedValue(makeNetworkError('Connection refused'));

    await expect(
      httpClient.request(
        { url: 'https://example.com', method: 'GET' },
        { retries: 2, delayMs: 0 }
      )
    ).rejects.toThrow('Connection refused');

    // 1 initial + 2 retries = 3 total calls
    expect(mockAxiosRequest).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry 404 Not Found errors', async () => {
    mockAxiosRequest.mockRejectedValue(makeHttpError(404, 'Not Found'));

    await expect(
      httpClient.request(
        { url: 'https://example.com/missing', method: 'GET' },
        { retries: 3, delayMs: 0 }
      )
    ).rejects.toThrow('Not Found');

    // Only 1 call — no retries for 404
    expect(mockAxiosRequest).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry 400 Bad Request errors', async () => {
    mockAxiosRequest.mockRejectedValue(makeHttpError(400, 'Bad Request'));

    await expect(
      httpClient.request(
        { url: 'https://example.com', method: 'GET' },
        { retries: 3, delayMs: 0 }
      )
    ).rejects.toThrow('Bad Request');

    expect(mockAxiosRequest).toHaveBeenCalledTimes(1);
  });

  it('DOES retry 503 Service Unavailable', async () => {
    const successResponse = { status: 200, data: {} };

    mockAxiosRequest
      .mockRejectedValueOnce(makeHttpError(503, 'Service Unavailable'))
      .mockResolvedValue(successResponse);

    const result = await httpClient.request(
      { url: 'https://example.com', method: 'GET' },
      { retries: 2, delayMs: 0 }
    );

    expect(result).toBe(successResponse);
    expect(mockAxiosRequest).toHaveBeenCalledTimes(2);
  });

  it('DOES retry 429 Too Many Requests', async () => {
    const successResponse = { status: 200, data: {} };

    mockAxiosRequest
      .mockRejectedValueOnce(makeHttpError(429, 'Too Many Requests'))
      .mockResolvedValue(successResponse);

    const result = await httpClient.request(
      { url: 'https://example.com', method: 'GET' },
      { retries: 2, delayMs: 0 }
    );

    expect(result).toBe(successResponse);
    expect(mockAxiosRequest).toHaveBeenCalledTimes(2);
  });
});

// ─── Convenience helpers ─────────────────────────────────────────────────────

describe('httpClient convenience helpers', () => {
  it('get() makes a GET request and resolves with the response', async () => {
    const fakeResponse = { status: 200, data: [] };
    mockAxiosRequest.mockResolvedValue(fakeResponse);

    const result = await httpClient.get('https://example.com/items');

    expect(result).toBe(fakeResponse);
    expect(mockAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.com/items', method: 'GET' })
    );
  });

  it('post() makes a POST request with the provided data', async () => {
    const fakeResponse = { status: 201, data: { id: 1 } };
    mockAxiosRequest.mockResolvedValue(fakeResponse);

    const result = await httpClient.post('https://example.com/items', { name: 'test' });

    expect(result).toBe(fakeResponse);
    expect(mockAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.com/items', method: 'POST' })
    );
  });

  it('get() exposes the axios client instance', () => {
    expect(httpClient.client).toBeDefined();
    expect(typeof httpClient.request).toBe('function');
    expect(typeof httpClient.get).toBe('function');
    expect(typeof httpClient.post).toBe('function');
  });
});
