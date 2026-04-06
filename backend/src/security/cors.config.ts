import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/** Origines dev (HTTPS par défaut ; HTTP conservé pour outils / anciennes configs). */
const defaultOrigins = [
  'https://localhost:5173',
  'https://127.0.0.1:5173',
  'https://localhost:3000',
  'https://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getAllowedOrigins(): string[] {
  const fromFrontend = process.env.FRONTEND_URL?.split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  const fromCors = process.env.CORS_ORIGINS?.split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  const extra = [...(fromFrontend ?? []), ...(fromCors ?? [])];
  if (isProduction()) {
    // En production, seules les origines explicitement configurées sont autorisées.
    return [...new Set(extra)];
  }
  return [...new Set([...defaultOrigins, ...extra])];
}

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins();
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 3600,
  preflightContinue: false,
};
