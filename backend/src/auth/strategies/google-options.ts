export function getGoogleStrategyOptions(): {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
} {
  const callbackURL = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (callbackURL) {
    return {
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL,
    };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('GOOGLE_CALLBACK_URL must be configured in production');
  }

  return {
    clientID: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackURL: 'http://localhost:3000/api/v1/auth/google/callback',
  };
}
