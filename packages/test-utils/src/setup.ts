import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB
beforeAll(() => {
  // Mock IDBRequest
  class MockIDBRequest extends EventTarget {
    result: unknown = null;
    error: unknown = null;
    source: unknown = null;
    transaction: unknown = null;
    readyState: 'pending' | 'done' = 'done';
    
    onsuccess: ((event: Event) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
  }

  // Mock IDBDatabase
  class MockIDBDatabase extends EventTarget {
    name = 'test-db';
    version = 1;
    objectStoreNames: string[] = [];

    createObjectStore = vi.fn(() => ({
      name: 'test-store',
      keyPath: null,
      indexNames: [],
      createIndex: vi.fn()
    }));

    transaction = vi.fn(() => ({
      objectStore: vi.fn(() => ({
        add: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        getAll: vi.fn(),
        count: vi.fn(),
        index: vi.fn(() => ({
          get: vi.fn(),
          getAll: vi.fn(),
          count: vi.fn(),
          openCursor: vi.fn()
        }))
      })),
      abort: vi.fn(),
      commit: vi.fn(),
      done: Promise.resolve()
    }));

    close = vi.fn();
  }

  const mockDB = new MockIDBDatabase();

  const indexedDB = {
    open: vi.fn(() => {
      const request = new MockIDBRequest();
      request.result = mockDB;
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess(new Event('success'));
        }
      }, 0);
      return request;
    }),
    deleteDatabase: vi.fn(),
    databases: vi.fn(() => Promise.resolve([])),
    cmp: vi.fn()
  };

  // Set up globals
  Object.defineProperty(global, 'indexedDB', {
    value: indexedDB,
    writable: true
  });

  Object.defineProperty(global, 'IDBRequest', {
    value: MockIDBRequest,
    writable: true
  });

  Object.defineProperty(global, 'IDBDatabase', {
    value: MockIDBDatabase,
    writable: true
  });
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock canvas context
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4)
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4)
  })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  ellipse: vi.fn(),
  rect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),
  isPointInPath: vi.fn(),
  isPointInStroke: vi.fn(),
  strokeStyle: '',
  fillStyle: '',
  globalAlpha: 1,
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  globalCompositeOperation: 'source-over',
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic'
}));