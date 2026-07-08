/**
 * Unit tests – Provider Registry
 * @file tests/providerRegistry.test.js
 */

// Use a fresh require for each test group to avoid state bleed
let registry;

const mockProvider = (platform = 'test') => ({
  platform,
  searchProducts: jest.fn().mockResolvedValue([])
});

beforeEach(() => {
  // Re-require to get a fresh module each time
  jest.resetModules();
  registry = require('../services/providerRegistry');
});

describe('register', () => {
  it('registers a valid provider without throwing', () => {
    expect(() => registry.register('test', mockProvider('test'))).not.toThrow();
  });

  it('throws when provider is missing searchProducts', () => {
    expect(() => registry.register('bad', { platform: 'bad' })).toThrow();
  });

  it('throws when provider is missing platform', () => {
    expect(() => registry.register('bad', { searchProducts: jest.fn() })).toThrow();
  });
});

describe('enable/disable', () => {
  it('disables a registered provider', () => {
    registry.register('test', mockProvider('test'));
    registry.disable('test');
    expect(registry.isRegistered('test')).toBe(false);
  });

  it('enables a previously disabled provider', () => {
    registry.register('test', mockProvider('test'));
    registry.disable('test');
    registry.enable('test');
    expect(registry.isRegistered('test')).toBe(true);
  });
});

describe('get', () => {
  it('returns the provider instance', () => {
    const provider = mockProvider('test');
    registry.register('test', provider);
    expect(registry.get('test')).toBe(provider);
  });

  it('throws for an unknown provider', () => {
    expect(() => registry.get('nonexistent')).toThrow();
  });

  it('throws for a disabled provider', () => {
    registry.register('test', mockProvider('test'));
    registry.disable('test');
    expect(() => registry.get('test')).toThrow();
  });
});

describe('getEnabledProviders', () => {
  it('returns only enabled providers', () => {
    registry.register('p1', mockProvider('p1'));
    registry.register('p2', mockProvider('p2'));
    registry.disable('p2');
    const enabled = registry.getEnabledProviders();
    const names = enabled.map((p) => p.name);
    expect(names).toContain('p1');
    expect(names).not.toContain('p2');
  });
});

describe('health tracking', () => {
  it('records successful requests', () => {
    registry.register('test', mockProvider('test'));
    registry.recordSuccess('test', 120);
    const report = registry.getHealthReport().find((p) => p.provider === 'test');
    expect(report.successfulRequests).toBe(1);
    expect(report.averageResponseTime).toBe(120);
  });

  it('records failed requests', () => {
    registry.register('test', mockProvider('test'));
    registry.recordFailure('test', 'timeout');
    const report = registry.getHealthReport().find((p) => p.provider === 'test');
    expect(report.failedRequests).toBe(1);
    expect(report.lastError).toBe('timeout');
    expect(report.status).toBe('Unhealthy');
  });

  it('reports Healthy when no failures', () => {
    registry.register('test', mockProvider('test'));
    registry.recordSuccess('test', 200);
    const report = registry.getHealthReport().find((p) => p.provider === 'test');
    expect(report.status).toBe('Healthy');
  });

  it('reports Disabled for disabled providers', () => {
    registry.register('test', mockProvider('test'));
    registry.disable('test');
    const report = registry.getHealthReport().find((p) => p.provider === 'test');
    expect(report.status).toBe('Disabled');
  });
});
