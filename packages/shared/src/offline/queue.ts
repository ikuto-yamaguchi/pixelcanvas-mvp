import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Operation, OperationSchema, QueueConfig, QueueStats } from './types';

interface OfflineQueueDB extends DBSchema {
  operations: {
    key: string;
    value: Operation;
    indexes: {
      'by-status': string;
      'by-timestamp': number;
      'by-type': string;
    };
  };
}

export class OfflineQueue {
  private db: IDBPDatabase<OfflineQueueDB> | null = null;
  private config: Required<QueueConfig>;
  private flushTimer: NodeJS.Timeout | null = null;
  private processingQueue = new Set<string>();
  private onlineHandler: ((operations: Operation[]) => Promise<void>) | null = null;

  constructor(config: QueueConfig = {}) {
    this.config = {
      dbName: config.dbName || 'pixelcanvas-offline',
      storeName: config.storeName || 'operations',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      batchSize: config.batchSize || 50,
      flushInterval: config.flushInterval || 5000
    };
  }

  async initialize(): Promise<void> {
    this.db = await openDB<OfflineQueueDB>(this.config.dbName, 1, {
      upgrade(db) {
        const store = db.createObjectStore('operations', { keyPath: 'id' });
        store.createIndex('by-status', 'status');
        store.createIndex('by-timestamp', 'timestamp');
        store.createIndex('by-type', 'type');
      }
    });

    // Start periodic flush
    this.startFlushTimer();

    // Listen for online/offline events
    window.addEventListener('online', () => this.flush());
    window.addEventListener('offline', () => this.stopFlushTimer());
  }

  async enqueue(operation: Omit<Operation, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) throw new Error('Queue not initialized');

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    
    const fullOperation = OperationSchema.parse({
      ...operation,
      id,
      timestamp,
      status: 'pending'
    });

    await this.db.add('operations', fullOperation);

    // Trigger immediate flush if online
    if (navigator.onLine && this.onlineHandler) {
      this.flush();
    }

    return id;
  }

  async dequeue(count: number = this.config.batchSize): Promise<Operation[]> {
    if (!this.db) throw new Error('Queue not initialized');

    const tx = this.db.transaction('operations', 'readwrite');
    const index = tx.store.index('by-status');
    const operations: Operation[] = [];

    let cursor = await index.openCursor('pending');
    while (cursor && operations.length < count) {
      const operation = cursor.value;
      if (!this.processingQueue.has(operation.id)) {
        operations.push(operation);
        this.processingQueue.add(operation.id);
        
        // Update status to processing
        await cursor.update({
          ...operation,
          status: 'processing'
        });
      }
      cursor = await cursor.continue();
    }

    await tx.done;
    return operations;
  }

  async markCompleted(ids: string[]): Promise<void> {
    if (!this.db) throw new Error('Queue not initialized');

    const tx = this.db.transaction('operations', 'readwrite');
    
    for (const id of ids) {
      await tx.store.delete(id);
      this.processingQueue.delete(id);
    }

    await tx.done;
  }

  async markFailed(id: string, _error?: Error): Promise<void> {
    if (!this.db) throw new Error('Queue not initialized');

    const operation = await this.db.get('operations', id);
    if (!operation) return;

    const retryCount = operation.retryCount + 1;
    this.processingQueue.delete(id);

    if (retryCount >= this.config.maxRetries) {
      await this.db.put('operations', {
        ...operation,
        status: 'failed',
        retryCount
      });
    } else {
      await this.db.put('operations', {
        ...operation,
        status: 'pending',
        retryCount
      });
    }
  }

  async getStats(): Promise<QueueStats> {
    if (!this.db) throw new Error('Queue not initialized');

    const tx = this.db.transaction('operations', 'readonly');
    const index = tx.store.index('by-status');

    const [pending, processing, failed, completed] = await Promise.all([
      index.count('pending'),
      index.count('processing'),
      index.count('failed'),
      index.count('completed')
    ]);

    const total = pending + processing + failed + completed;

    return { pending, processing, failed, completed, total };
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('Queue not initialized');
    
    const tx = this.db.transaction('operations', 'readwrite');
    await tx.store.clear();
    await tx.done;
    
    this.processingQueue.clear();
  }

  async getAll(status?: Operation['status']): Promise<Operation[]> {
    if (!this.db) throw new Error('Queue not initialized');

    if (status) {
      const index = this.db.transaction('operations', 'readonly').store.index('by-status');
      return await index.getAll(status);
    }

    return await this.db.getAll('operations');
  }

  setOnlineHandler(handler: (operations: Operation[]) => Promise<void>): void {
    this.onlineHandler = handler;
  }

  private async flush(): Promise<void> {
    if (!navigator.onLine || !this.onlineHandler) return;

    try {
      const operations = await this.dequeue();
      if (operations.length === 0) return;

      await this.onlineHandler(operations);
      await this.markCompleted(operations.map(op => op.id));
    } catch (error) {
      // Mark all operations as failed
      for (const operation of await this.getAll('processing')) {
        await this.markFailed(operation.id, error as Error);
      }
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      if (navigator.onLine) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  async close(): Promise<void> {
    this.stopFlushTimer();
    
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}