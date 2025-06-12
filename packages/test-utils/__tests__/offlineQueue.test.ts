import { describe, it, expect, vi } from 'vitest';

// Simple mock for integration tests
vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    add: vi.fn(),
    clear: vi.fn(),
    close: vi.fn(),
    transaction: vi.fn(() => ({
      store: { index: vi.fn(() => ({ count: vi.fn(() => 0) })) },
      done: Promise.resolve()
    }))
  })
}));

Object.defineProperty(global, 'window', {
  value: { addEventListener: vi.fn() },
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: { onLine: true },
  writable: true
});

import { OfflineQueue } from '../../shared/src/offline/queue';

describe('OfflineQueue Integration', () => {
  it('should create queue instance', () => {
    const queue = new OfflineQueue();
    expect(queue).toBeDefined();
  });

  it('should handle basic methods', () => {
    const queue = new OfflineQueue();
    const handler = vi.fn();
    
    expect(() => queue.setOnlineHandler(handler)).not.toThrow();
  });
});