import { corsConfig } from './cors.config';

describe('CORS Configuration', () => {
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
});
