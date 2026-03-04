import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001',
];

function getAllowedOrigins(): string[] {
  if (process.env.FRONTEND_URL) {
    const fromEnv = process.env.FRONTEND_URL.split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    return [...new Set([...defaultOrigins, ...fromEnv])];
  }
  return defaultOrigins;
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
