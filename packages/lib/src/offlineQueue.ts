/**
 * Interface representing a pixel operation queued for offline sync
 */
export interface QueuedPixel {
  id: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

/**
 * Offline queue for storing pixel operations when the connection is unavailable
 */
class OfflineQueue {
  private queue: QueuedPixel[] = [];
  private readonly storageKey = 'pixelcanvas:offlineQueue';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a pixel operation to the queue
   */
  enqueue(pixel: QueuedPixel): void {
    this.queue.push(pixel);
    this.saveToStorage();
  }

  /**
   * Remove and return the first pixel operation from the queue
   */
  dequeue(): QueuedPixel | undefined {
    const pixel = this.queue.shift();
    if (pixel) {
      this.saveToStorage();
    }
    return pixel;
  }

  /**
   * Get all pixel operations in the queue without removing them
   */
  getAll(): QueuedPixel[] {
    return [...this.queue];
  }

  /**
   * Clear all pixel operations from the queue
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Get the number of pixel operations in the queue
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Save the queue to localStorage
   */
  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
      }
    } catch (error) {
      console.warn('Failed to save offline queue to localStorage:', error);
    }
  }

  /**
   * Load the queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          this.queue = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.warn('Failed to load offline queue from localStorage:', error);
      this.queue = [];
    }
  }
}

// Export a singleton instance
export const offlineQueue = new OfflineQueue();