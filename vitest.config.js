import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./resources/js/test/setup.js'],
    include: ['resources/js/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage/front',
      include: ['resources/js/**/*.{js,jsx}'],
      exclude: [
        'resources/js/main.jsx',
        'resources/js/assets/**',
        'resources/js/**/*.test.{js,jsx}',
        'resources/js/test/**',
      ],
    },
  },
});
