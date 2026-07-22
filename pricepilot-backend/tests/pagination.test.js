/**
 * Unit tests – Pagination
 * @file tests/pagination.test.js
 *
 * Tests the page/limit/hasNextPage behaviour in the Search API.
 * Uses supertest to send real HTTP requests against the full Express app.
 */

const request = require('supertest');

jest.mock('../services/browserQueue', () => ({
  acquire: jest.fn().mockRejectedValue(new Error('Playwright not available in Pagination test')),
  getMetrics: jest.fn(() => ({ queueLength: 0, activePages: 0, maxPages: 5 }))
}));

const app     = require('../app');

describe('GET /api/search – Pagination', () => {
  it('returns page=1 and limit=20 by default', async () => {
    const res = await request(app).get('/api/search?q=shoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 20);
  });

  it('respects page and limit query params', async () => {
    const res = await request(app).get('/api/search?q=shoes&page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeLessThanOrEqual(2);
  });

  it('returns hasNextPage = true when there are more results than limit', async () => {
    const res = await request(app).get('/api/search?q=red shoes&limit=1');
    expect(res.status).toBe(200);
    // If there is more than 1 total result, hasNextPage should be true
    if (res.body.totalResults > 1) {
      expect(res.body.hasNextPage).toBe(true);
    }
  });

  it('returns hasNextPage = false on the last page', async () => {
    // Request a very large limit to get all results on one page
    const res = await request(app).get('/api/search?q=red shoes&page=1&limit=1000');
    expect(res.status).toBe(200);
    expect(res.body.hasNextPage).toBe(false);
  });

  it('page 2 with limit 1 returns different product than page 1', async () => {
    const res1 = await request(app).get('/api/search?q=shoes&page=1&limit=1');
    const res2 = await request(app).get('/api/search?q=shoes&page=2&limit=1');

    if (res1.body.products.length > 0 && res2.body.products.length > 0) {
      const id1 = res1.body.products[0].productId;
      const id2 = res2.body.products[0].productId;
      expect(id1).not.toBe(id2);
    }
  });

  it('returns 400 when query is missing', async () => {
    const res = await request(app).get('/api/search?page=1&limit=5');
    expect(res.status).toBe(400);
  });

  it('clamps limit to MAX_LIMIT (100)', async () => {
    const res = await request(app).get('/api/search?q=shoes&limit=9999');
    expect(res.status).toBe(200);
    expect(res.body.limit).toBeLessThanOrEqual(100);
  });

  it('totalResults reflects all matching products, not just the current page', async () => {
    const small = await request(app).get('/api/search?q=shoes&limit=1');
    const large = await request(app).get('/api/search?q=shoes&limit=1000');

    if (small.body.success && large.body.success) {
      expect(small.body.totalResults).toBe(large.body.totalResults);
    }
  });
});

describe('GET /api/browser', () => {
  it('returns 200 with browser metrics', async () => {
    const res = await request(app).get('/api/browser');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('browser');
    expect(res.body).toHaveProperty('queue');
  });

  it('browser object has expected fields', async () => {
    const res = await request(app).get('/api/browser');
    const { browser } = res.body;
    expect(browser).toHaveProperty('available');
    expect(browser).toHaveProperty('activeBrowsers');
    expect(browser).toHaveProperty('activeContexts');
    expect(browser).toHaveProperty('activePages');
    expect(browser).toHaveProperty('uptimeMs');
  });

  it('queue object has expected fields', async () => {
    const res = await request(app).get('/api/browser');
    const { queue } = res.body;
    expect(queue).toHaveProperty('queueLength');
    expect(queue).toHaveProperty('activePages');
    expect(queue).toHaveProperty('maxPages');
  });
});
