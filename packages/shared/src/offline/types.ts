import { z } from 'zod';

// Operation types
export const OperationType = z.enum(['PIXEL_UPDATE', 'BATCH_UPDATE', 'LAYER_CREATE', 'LAYER_UPDATE', 'LAYER_DELETE']);
export type OperationType = z.infer<typeof OperationType>;

// Base operation schema
export const BaseOperationSchema = z.object({
  id: z.string(),
  type: OperationType,
  timestamp: z.number(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  status: z.enum(['pending', 'processing', 'failed', 'completed']).default('pending')
});

// Pixel update operation
export const PixelUpdateSchema = BaseOperationSchema.extend({
  type: z.literal('PIXEL_UPDATE'),
  data: z.object({
    x: z.number(),
    y: z.number(),
    color: z.string(),
    layerId: z.string().optional()
  })
});

// Batch update operation
export const BatchUpdateSchema = BaseOperationSchema.extend({
  type: z.literal('BATCH_UPDATE'),
  data: z.object({
    pixels: z.array(z.object({
      x: z.number(),
      y: z.number(),
      color: z.string()
    })),
    layerId: z.string().optional()
  })
});

// Layer operations
export const LayerCreateSchema = BaseOperationSchema.extend({
  type: z.literal('LAYER_CREATE'),
  data: z.object({
    name: z.string(),
    opacity: z.number().min(0).max(1).default(1),
    visible: z.boolean().default(true),
    locked: z.boolean().default(false)
  })
});

export const LayerUpdateSchema = BaseOperationSchema.extend({
  type: z.literal('LAYER_UPDATE'),
  data: z.object({
    id: z.string(),
    name: z.string().optional(),
    opacity: z.number().min(0).max(1).optional(),
    visible: z.boolean().optional(),
    locked: z.boolean().optional()
  })
});

export const LayerDeleteSchema = BaseOperationSchema.extend({
  type: z.literal('LAYER_DELETE'),
  data: z.object({
    id: z.string()
  })
});

// Union of all operations
export const OperationSchema = z.discriminatedUnion('type', [
  PixelUpdateSchema,
  BatchUpdateSchema,
  LayerCreateSchema,
  LayerUpdateSchema,
  LayerDeleteSchema
]);

export type Operation = z.infer<typeof OperationSchema>;
export type PixelUpdate = z.infer<typeof PixelUpdateSchema>;
export type BatchUpdate = z.infer<typeof BatchUpdateSchema>;
export type LayerCreate = z.infer<typeof LayerCreateSchema>;
export type LayerUpdate = z.infer<typeof LayerUpdateSchema>;
export type LayerDelete = z.infer<typeof LayerDeleteSchema>;

// Queue configuration
export interface QueueConfig {
  dbName?: string;
  storeName?: string;
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  flushInterval?: number;
}

// Queue statistics
export interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  total: number;
}