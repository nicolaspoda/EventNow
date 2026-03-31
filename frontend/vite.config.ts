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

export default defineConfig({
  plugins: [react(), basicSsl()],
  optimizeDeps: {
    include: ['react-big-calendar', 'date-fns', 'socket.io-client'],
  },
  server: {
    // HTTPS : @vitejs/plugin-basic-ssl injecte cert/key (Vite 7 : plus de `https: true` booléen).
    host: true, // pour Docker : écoute sur 0.0.0.0
    ...(hmrBehindProxy ? { hmr: hmrBehindProxy } : {}),
    /**
     * En dev HTTPS, proxy l’API en same-origin (évite les soucis HTTP↔HTTPS côté navigateur).
     * Peut être surchargé via: VITE_API_PROXY_TARGET=https://localhost:3000
     */
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
  },
});
