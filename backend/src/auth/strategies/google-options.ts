export function getGoogleStrategyOptions(): {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
} {
  return {
    clientID: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackURL:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/auth/google/callback',
  };
}
