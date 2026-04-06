import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

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

// basicSsl uniquement pour `npm run dev` : en Docker (`npm run preview`) on reste en HTTP
// pour que Nginx puisse faire `proxy_pass http://127.0.0.1:5173` sans TLS amont.
const useDevHttps = process.env.npm_lifecycle_event === 'dev';

export default defineConfig({
  plugins: [react(), ...(useDevHttps ? [basicSsl()] : [])],
  optimizeDeps: {
    include: ['react-big-calendar', 'date-fns', 'socket.io-client'],
  },
  server: {
    // HTTPS en local : @vitejs/plugin-basic-ssl (Vite 7 : plus de `https: true` booléen).
    host: true, // pour Docker : écoute sur 0.0.0.0
    ...(hmrBehindProxy ? { hmr: hmrBehindProxy } : {}),
    /**
     * Proxy API uniquement en `npm run dev` : en `vite preview` (Docker) l’API passe par Nginx,
     * sinon le proxy vers localhost:3000 dans le conteneur provoque ECONNREFUSED.
     */
    ...(useDevHttps
      ? {
          proxy: {
            '/api': {
              target: process.env.VITE_API_PROXY_TARGET || 'https://localhost:3000',
              changeOrigin: true,
              secure: false,
            },
            '/socket.io': {
              target: process.env.VITE_API_PROXY_TARGET || 'https://localhost:3000',
              changeOrigin: true,
              secure: false,
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
