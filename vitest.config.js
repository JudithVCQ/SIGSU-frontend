import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    env: {
      VITE_USE_MOCKS: 'true',
      VITE_API_URL: 'http://localhost:8080',
    },
  },
});
