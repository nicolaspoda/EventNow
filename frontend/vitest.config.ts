import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', 'e2e/**'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/__tests__/**', 'src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
});
