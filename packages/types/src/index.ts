import { z } from 'zod';

// Base types
export const UuidSchema = z.string().uuid();
export const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
export const TimestampSchema = z.number().int().positive();

// Canvas types
export const CanvasSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
  backgroundColor: ColorSchema.default('#FFFFFF'),
  isPublic: z.boolean().default(true),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: UuidSchema.optional()
});

// Layer types
export const LayerSchema = z.object({
  id: UuidSchema,
  canvasId: UuidSchema,
  name: z.string().min(1).max(255),
  opacity: z.number().min(0).max(1).default(1),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  zIndex: z.number().int().default(0),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: UuidSchema.optional()
});

// User types
export const UserSchema = z.object({
  id: UuidSchema,
  email: z.string().email(),
  username: z.string().min(3).max(50),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
});

// Session types
export const UserSessionSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  canvasId: UuidSchema,
  cursorX: z.number().int().optional(),
  cursorY: z.number().int().optional(),
  isActive: z.boolean().default(true),
  lastSeen: TimestampSchema,
  createdAt: TimestampSchema
});

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: TimestampSchema
});

export const PaginatedResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      hasNext: z.boolean(),
      hasPrev: z.boolean()
    }),
    error: z.string().optional(),
    timestamp: TimestampSchema
  });

// WebSocket event types
export const SocketEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pixel_update'),
    data: z.object({
      canvasId: UuidSchema,
      x: z.number().int(),
      y: z.number().int(),
      color: ColorSchema,
      userId: UuidSchema.optional()
    })
  }),
  z.object({
    type: z.literal('cursor_move'),
    data: z.object({
      canvasId: UuidSchema,
      userId: UuidSchema,
      x: z.number().int(),
      y: z.number().int()
    })
  }),
  z.object({
    type: z.literal('user_join'),
    data: z.object({
      canvasId: UuidSchema,
      user: UserSchema
    })
  }),
  z.object({
    type: z.literal('user_leave'),
    data: z.object({
      canvasId: UuidSchema,
      userId: UuidSchema
    })
  })
]);

// Error types
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: TimestampSchema
});

// Type exports
export type Canvas = z.infer<typeof CanvasSchema>;
export type Layer = z.infer<typeof LayerSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserSession = z.infer<typeof UserSessionSchema>;
export type ApiResponse<T = unknown> = z.infer<typeof ApiResponseSchema> & { data?: T };
export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<T>>>;
export type SocketEvent = z.infer<typeof SocketEventSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Re-export from canvas-engine
export type { 
  Pixel, 
  Sector, 
  SectorCoordinate, 
  SectorUpdate 
} from '@pixelcanvas/canvas-engine';

// Re-export from shared
export type { 
  Operation, 
  OperationType, 
  QueueStats 
} from '@pixelcanvas/shared';