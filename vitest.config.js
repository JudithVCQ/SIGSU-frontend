import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      VITE_USE_MOCKS: 'true',
      VITE_API_URL: 'http://localhost:8080',
    },
  },
});

