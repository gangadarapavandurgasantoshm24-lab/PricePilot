/**
 * Integration tests – Category-Aware Search API
 * @file tests/categorySearch.test.js
 *
 * Tests the full search flow with category detection and provider routing
 * via the real Express app.
 */

const request = require('supertest');

jest.mock('../services/browserQueue', () => ({
  acquire: jest.fn().mockRejectedValue(new Error('Playwright not available in Category Search test')),
  getMetrics: jest.fn(() => ({ queueLength: 0, activePages: 0, maxPages: 5 }))
}));

const app     = require('../app');

describe('GET /api/search – Category Detection in Response', () => {
  it('returns detectedCategory field', async () => {
    const res = await request(app).get('/api/search?q=iphone');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('detectedCategory');
  });

  it('returns categoryLabel field', async () => {
    const res = await request(app).get('/api/search?q=lipstick');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categoryLabel');
  });

  it('detects electronics for "iphone" query', async () => {
    const res = await request(app).get('/api/search?q=iphone');
    expect(res.status).toBe(200);
    expect(res.body.detectedCategory).toBe('electronics');
  });

  it('detects fashion for "running shoes" query', async () => {
    const res = await request(app).get('/api/search?q=running shoes');
    expect(res.status).toBe(200);
    expect(res.body.detectedCategory).toBe('fashion');
  });

  it('detects beauty for "lipstick" query', async () => {
    const res = await request(app).get('/api/search?q=lipstick');
    expect(res.status).toBe(200);
    expect(res.body.detectedCategory).toBe('beauty');
  });

  it('detects medicine for "paracetamol" query', async () => {
    const res = await request(app).get('/api/search?q=paracetamol');
    expect(res.status).toBe(200);
    expect(res.body.detectedCategory).toBe('medicine');
  });

  it('returns general for unrecognised query', async () => {
    const res = await request(app).get('/api/search?q=xyzproducttest1234');
    expect(res.status).toBe(200);
    expect(res.body.detectedCategory).toBe('general');
  });
});

describe('GET /api/search – Category reduces provider count', () => {
  it('fewer providers queried for medicine vs general', async () => {
    const medicine = await request(app).get('/api/search?q=paracetamol');
    const general  = await request(app).get('/api/search?q=xyzabc');
    expect(medicine.status).toBe(200);
    expect(general.status).toBe(200);
    // Medicine should query fewer providers than general (all providers)
    expect(medicine.body.totalPlatforms).toBeLessThan(general.body.totalPlatforms);
  });

  it('fewer providers queried for beauty vs general', async () => {
    const beauty  = await request(app).get('/api/search?q=lipstick');
    const general = await request(app).get('/api/search?q=xyzabc');
    expect(beauty.status).toBe(200);
    expect(beauty.body.totalPlatforms).toBeLessThan(general.body.totalPlatforms);
  });
});

describe('GET /api/search – explicit category param', () => {
  it('respects explicit category=electronics param', async () => {
    const res = await request(app).get('/api/search?q=product&category=electronics');
    expect(res.status).toBe(200);
    expect(res.body.detectedCategory).toBe('electronics');
  });

  it('respects explicit category=beauty param', async () => {
    const res = await request(app).get('/api/search?q=product&category=beauty');
    expect(res.status).toBe(200);
    expect(res.body.detectedCategory).toBe('beauty');
  });
});

describe('GET /api/search – new providers in response', () => {
  it('purplle provider appears for beauty search', async () => {
    const res = await request(app).get('/api/search?q=lipstick');
    expect(res.status).toBe(200);
    const providerNames = (res.body.providerResults || []).map(p => p.name || p.platform);
    expect(providerNames).toContain('purplle');
  });

  it('meesho provider appears for fashion search', async () => {
    const res = await request(app).get('/api/search?q=running shoes');
    expect(res.status).toBe(200);
    const providerNames = (res.body.providerResults || []).map(p => p.name || p.platform);
    expect(providerNames).toContain('meesho');
  });

  it('myntra provider appears for fashion search', async () => {
    const res = await request(app).get('/api/search?q=running shoes');
    expect(res.status).toBe(200);
    const providerNames = (res.body.providerResults || []).map(p => p.name || p.platform);
    expect(providerNames).toContain('myntra');
  });

  it('apollo appears for medicine search', async () => {
    const res = await request(app).get('/api/search?q=paracetamol');
    expect(res.status).toBe(200);
    const providerNames = (res.body.providerResults || []).map(p => p.name || p.platform);
    expect(providerNames).toContain('apollo');
  });
});
