// Test helper functions

import { vi } from 'vitest';

/**
 * Generate a random hex color
 */
export function randomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Generate a grid of pixels for testing
 */
export function generatePixelGrid(width: number, height: number, canvasId: string) {
  const pixels = [];
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      pixels.push({
        id: `pixel-${x}-${y}`,
        canvasId,
        x,
        y,
        color: randomColor(),
        placedBy: 'test-user-id',
        placedAt: new Date().toISOString(),
      });
    }
  }
  return pixels;
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock WebSocket
 */
export function createMockWebSocket() {
  const listeners: { [key: string]: ((...args: unknown[]) => unknown)[] } = {};
  
  return {
    addEventListener: (event: string, handler: (...args: unknown[]) => unknown) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener: (event: string, handler: (...args: unknown[]) => unknown) => {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(h => h !== handler);
    },
    send: vi.fn(),
    close: vi.fn(),
    emit: (event: string, data: unknown) => {
      if (!listeners[event]) return;
      listeners[event].forEach(handler => handler(data));
    },
  };
}