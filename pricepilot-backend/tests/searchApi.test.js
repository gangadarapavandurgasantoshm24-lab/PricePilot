/**
 * Integration tests – Search API
 * @file tests/searchApi.test.js
 */

const request = require('supertest');

jest.mock('../services/browserQueue', () => ({
  acquire: jest.fn().mockRejectedValue(new Error('Playwright not available in Search API test')),
  getMetrics: jest.fn(() => ({ queueLength: 0, activePages: 0, maxPages: 5 }))
}));

const app = require('../app');

describe('GET /api/health', () => {
  it('returns 200 with success:true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/search', () => {
  it('returns 400 when query is missing', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when query is blank', async () => {
    const res = await request(app).get('/api/search?q=');
    expect(res.status).toBe(400);
  });

  it('returns 200 and product array for a known query', async () => {
    const res = await request(app).get('/api/search?q=red+shoes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('includes providerResults in the response', async () => {
    const res = await request(app).get('/api/search?q=headphones');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.providerResults)).toBe(true);
  });

  it('includes executionTimeMs in the response', async () => {
    const res = await request(app).get('/api/search?q=laptop');
    expect(res.status).toBe(200);
    expect(typeof res.body.executionTimeMs).toBe('number');
  });

  it('respects sortBy=highestRating', async () => {
    const res = await request(app).get('/api/search?q=iphone&sortBy=highestRating');
    expect(res.status).toBe(200);
    const ratings = res.body.products.map((p) => p.rating);
    for (let i = 1; i < ratings.length; i += 1) {
      expect(ratings[i - 1]).toBeGreaterThanOrEqual(ratings[i]);
    }
  });
});

describe('GET /api/platforms', () => {
  it('returns the list of supported platforms', async () => {
    const res = await request(app).get('/api/platforms');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.platforms)).toBe(true);
    expect(res.body.platforms.length).toBeGreaterThan(0);
  });
});

describe('GET /api/providers', () => {
  it('returns provider health report', async () => {
    const res = await request(app).get('/api/providers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.providers)).toBe(true);
    expect(res.body.providers.length).toBeGreaterThan(0);
  });

  it('each provider has required fields', async () => {
    const res = await request(app).get('/api/providers');
    res.body.providers.forEach((p) => {
      expect(p).toHaveProperty('provider');
      expect(p).toHaveProperty('status');
      expect(p).toHaveProperty('strategy');
    });
  });
});

describe('GET /api/analytics', () => {
  it('returns analytics summary', async () => {
    const res = await request(app).get('/api/analytics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analytics).toHaveProperty('totalSearches');
    expect(res.body.analytics).toHaveProperty('cacheHitRate');
    expect(res.body.analytics).toHaveProperty('providerStats');
  });
});

describe('GET /api/history', () => {
  it('returns search history array', async () => {
    const res = await request(app).get('/api/history');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  it('respects limit query param', async () => {
    // Trigger some searches first
    await request(app).get('/api/search?q=shoes');
    await request(app).get('/api/search?q=laptop');
    const res = await request(app).get('/api/history?limit=1');
    expect(res.body.history.length).toBeLessThanOrEqual(1);
  });
});

describe('GET /api/platform/:platform', () => {
  it('returns 404 for an unsupported platform', async () => {
    const res = await request(app).get('/api/platform/nonexistent?q=test');
    expect(res.status).toBe(404);
  });

  it('returns results for a supported platform', async () => {
    const res = await request(app).get('/api/platform/amazon?q=red+shoes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
