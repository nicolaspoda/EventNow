import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  optimizeDeps: {
    include: ['react-big-calendar', 'date-fns', 'socket.io-client'],
  },
  server: {
    https: true,
    host: true, // pour Docker : écoute sur 0.0.0.0
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
