import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export function configureHelmet(app: INestApplication) {
  const extraCspHosts = (process.env.STRIPE_CSP_EXTRA_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter((host) => host.length > 0);

  const stripeScriptSrc = ['https://js.stripe.com'];
  const stripeFrameSrc = [
    'https://js.stripe.com',
    'https://hooks.stripe.com',
    'https://*.stripe.com',
  ];
  const stripeConnectSrc = [
    'https://api.stripe.com',
    'https://q.stripe.com',
    'https://r.stripe.com',
    'https://m.stripe.com',
  ];

  const mergedHosts = Array.from(
    new Set([...extraCspHosts, ...stripeScriptSrc, ...stripeFrameSrc, ...stripeConnectSrc]),
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", ...stripeScriptSrc, ...extraCspHosts],
          imgSrc: ["'self'", 'data:', 'https:'],
          frameSrc: ["'self'", ...stripeFrameSrc, ...extraCspHosts],
          connectSrc: ["'self'", ...stripeConnectSrc, ...extraCspHosts],
          fontSrc: ["'self'", 'data:', 'https:'],
          workerSrc: ["'self'", 'blob:'],
          childSrc: ["'self'", ...stripeFrameSrc, ...extraCspHosts],
          frameAncestors: ["'self'"],
          formAction: ["'self'", ...mergedHosts],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
}
