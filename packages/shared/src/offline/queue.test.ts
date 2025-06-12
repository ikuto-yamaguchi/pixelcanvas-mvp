import { describe, it, expect, beforeEach, vi } from 'vitest';

// Hoisted mock - must be at top level
vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    add: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    transaction: vi.fn(() => ({
      store: {
        clear: vi.fn(),
        index: vi.fn(() => ({
          openCursor: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(0),
          getAll: vi.fn().mockResolvedValue([])
        }))
      },
      done: Promise.resolve()
    })),
    close: vi.fn()
  })
}));

// Mock window and navigator
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn()
  },
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true
  },
  writable: true
});

import { OfflineQueue } from './queue';

describe('OfflineQueue', () => {
  let queue: OfflineQueue;

  beforeEach(async () => {
    vi.clearAllMocks();
    queue = new OfflineQueue({
      dbName: 'test-db',
      maxRetries: 3,
      batchSize: 10
    });
    await queue.initialize();
  });

  describe('basic functionality', () => {
    it('should create queue instance', () => {
      expect(queue).toBeDefined();
    });

    it('should initialize without errors', async () => {
      const newQueue = new OfflineQueue();
      await expect(newQueue.initialize()).resolves.not.toThrow();
      await newQueue.close();
    });
  });

  describe('enqueue', () => {
    it('should add operation to queue', async () => {
      const operation = {
        type: 'PIXEL_UPDATE' as const,
        status: 'pending' as const,
        retryCount: 0,
        maxRetries: 3,
        data: { x: 100, y: 200, color: '#FF0000' }
      };

      const id = await queue.enqueue(operation);
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });
  });

  describe('stats', () => {
    it('should return queue statistics', async () => {
      const stats = await queue.getStats();
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('total');
    });
  });

  describe('clear', () => {
    it('should clear all operations', async () => {
      await expect(queue.clear()).resolves.not.toThrow();
    });
  });

  describe('close', () => {
    it('should close queue properly', async () => {
      await expect(queue.close()).resolves.not.toThrow();
    });
  });
});