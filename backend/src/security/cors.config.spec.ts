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
    expect(origins).toContain('http://localhost:5173');
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
    expect(origins).not.toContain('http://localhost:5173');
  });

  describe('origin callback', () => {
    const originFn = corsConfig.origin as (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void;

    it('should allow requests with no origin (preflight)', () => {
      const cb = jest.fn();
      originFn(undefined, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should allow requests from an allowed origin', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.FRONTEND_URL;
      delete process.env.CORS_ORIGINS;
      const cb = jest.fn();
      originFn('http://localhost:5173', cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should block requests from a disallowed origin', () => {
      process.env.NODE_ENV = 'production';
      process.env.FRONTEND_URL = 'https://app.eventnow.com';
      delete process.env.CORS_ORIGINS;
      const cb = jest.fn();
      originFn('https://evil.com', cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
