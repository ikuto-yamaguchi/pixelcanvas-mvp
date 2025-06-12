import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@pixelcanvas/shared': resolve(__dirname, '../../packages/shared/src'),
      '@pixelcanvas/ui': resolve(__dirname, '../../packages/ui/src'),
      '@pixelcanvas/canvas-engine': resolve(__dirname, '../../packages/canvas-engine/src'),
    },
  },
});