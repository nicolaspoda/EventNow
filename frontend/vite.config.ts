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
  },
});
