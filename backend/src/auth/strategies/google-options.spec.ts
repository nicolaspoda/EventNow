import { getGoogleStrategyOptions } from './google-options';

describe('getGoogleStrategyOptions', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should use env vars when set', () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://custom/callback';

    const options = getGoogleStrategyOptions();

    expect(options.clientID).toBe('client-id');
    expect(options.clientSecret).toBe('client-secret');
    expect(options.callbackURL).toBe('http://custom/callback');
  });

  it('should use empty string when GOOGLE_CLIENT_ID unset', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    delete process.env.GOOGLE_CALLBACK_URL;

    const options = getGoogleStrategyOptions();

    expect(options.clientID).toBe('');
    expect(options.clientSecret).toBe('secret');
    expect(options.callbackURL).toBe(
      'https://localhost:3000/api/v1/auth/google/callback',
    );
  });

  it('should use empty string when GOOGLE_CLIENT_SECRET unset', () => {
    process.env.GOOGLE_CLIENT_ID = 'id';
    delete process.env.GOOGLE_CLIENT_SECRET;

    const options = getGoogleStrategyOptions();

    expect(options.clientSecret).toBe('');
  });

  it('should use default callback URL when GOOGLE_CALLBACK_URL unset', () => {
    process.env.GOOGLE_CLIENT_ID = 'id';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    delete process.env.GOOGLE_CALLBACK_URL;

    const options = getGoogleStrategyOptions();

    expect(options.callbackURL).toBe(
      'https://localhost:3000/api/v1/auth/google/callback',
    );
  });
});
