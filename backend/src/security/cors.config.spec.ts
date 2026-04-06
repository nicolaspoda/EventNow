import { corsConfig, getAllowedOrigins } from './cors.config';

describe('CORS Configuration', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should have default origin', () => {
    expect(corsConfig.origin).toBeDefined();
  });

  it('should allow credentials', () => {
    expect(corsConfig.credentials).toBe(true);
  });

  it('should define allowed methods', () => {
    expect(corsConfig.methods).toContain('GET');
    expect(corsConfig.methods).toContain('POST');
  });

  it('should define allowed headers', () => {
    expect(corsConfig.allowedHeaders).toContain('Content-Type');
    expect(corsConfig.allowedHeaders).toContain('Authorization');
  });

  it('should include localhost defaults in non-production', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.FRONTEND_URL;
    delete process.env.CORS_ORIGINS;

    const origins = getAllowedOrigins();
    expect(origins).toContain('https://localhost:5173');
    expect(origins).toContain('http://localhost:3000');
  });

  it('should only allow configured origins in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://app.eventnow.com';
    process.env.CORS_ORIGINS = 'https://admin.eventnow.com';

    const origins = getAllowedOrigins();
    expect(origins).toEqual([
      'https://app.eventnow.com',
      'https://admin.eventnow.com',
    ]);
    expect(origins).not.toContain('https://localhost:5173');
  });
});
