import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// En prod, servir `dist/` (nginx/Caddy) — pas `npm run dev`. Sinon le client HMR
// (@vite/client) reste chargé et tente des WebSockets (bruit / erreurs console).
const hmrBehindProxy =
  process.env.VITE_HMR_HOST && process.env.VITE_HMR_HOST.length > 0
    ? {
        protocol: 'wss' as const,
        host: process.env.VITE_HMR_HOST,
        clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || 443),
      }
    : undefined;

// Proxy API uniquement en `npm run dev` : en Docker (`npm run preview`) on reste en HTTP
// pour que Nginx puisse faire `proxy_pass http://127.0.0.1:5173`, et l'API passe par Nginx
// (un proxy vers localhost:3000 dans le conteneur provoquerait ECONNREFUSED).
const isDev = process.env.npm_lifecycle_event === 'dev';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-big-calendar', 'date-fns', 'socket.io-client'],
  },
  server: {
    host: true, // pour Docker : écoute sur 0.0.0.0
    ...(hmrBehindProxy ? { hmr: hmrBehindProxy } : {}),
    ...(isDev
      ? {
          proxy: {
            '/api': {
              target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
              changeOrigin: true,
            },
            '/socket.io': {
              target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
              changeOrigin: true,
              ws: true,
            },
          },
        }
      : {}),
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    // Derrière Nginx avec Host public, Vite 7 refuse sinon (403).
    allowedHosts: ['eventnow.fr', 'www.eventnow.fr'],
  },
});
