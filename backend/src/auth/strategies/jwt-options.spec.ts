import { getJwtSecret } from './jwt-options';

describe('getJwtSecret', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return JWT_SECRET when set', () => {
    process.env.JWT_SECRET = 'my-secret';
    expect(getJwtSecret()).toBe('my-secret');
  });

  it('should return fallback when JWT_SECRET unset', () => {
    delete process.env.JWT_SECRET;
    expect(getJwtSecret()).toBe('your-secret-key');
  });
});
