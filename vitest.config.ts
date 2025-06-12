import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./packages/test-utils/src/setup.ts'],
    include: [
      '**/*.{test,spec}.{js,jsx,ts,tsx}',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/.next/**',
      '!**/e2e/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/__mocks__/**',
        '**/tests/**',
        '**/test-utils/**'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@pixelcanvas/types': resolve(__dirname, './packages/types/src'),
      '@pixelcanvas/shared': resolve(__dirname, './packages/shared/src'),
      '@pixelcanvas/canvas-engine': resolve(__dirname, './packages/canvas-engine/src'),
      '@pixelcanvas/test-utils': resolve(__dirname, './packages/test-utils/src')
    }
  }
});