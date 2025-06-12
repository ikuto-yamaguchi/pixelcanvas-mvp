import { z } from 'zod';

// Sector constants
export const SECTOR_SIZE = 256; // 256x256 pixels per sector
export const BYTES_PER_PIXEL = 4; // RGBA
export const SECTOR_BYTE_SIZE = SECTOR_SIZE * SECTOR_SIZE * BYTES_PER_PIXEL; // 262,144 bytes

// Coordinate schemas
export const CoordinateSchema = z.object({
  x: z.number().int(),
  y: z.number().int()
});

export const SectorCoordinateSchema = z.object({
  sectorX: z.number().int(),
  sectorY: z.number().int()
});

// Pixel data schema
export const PixelSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
  a: z.number().int().min(0).max(255).default(255)
});

// Sector schema
export const SectorSchema = z.object({
  id: z.string().uuid(),
  canvasId: z.string().uuid(),
  sectorX: z.number().int(),
  sectorY: z.number().int(),
  pixels: z.instanceof(Uint8ClampedArray).optional(),
  isDirty: z.boolean().default(false),
  lastModified: z.number(),
  version: z.number().default(1)
});

// Type exports
export type Coordinate = z.infer<typeof CoordinateSchema>;
export type SectorCoordinate = z.infer<typeof SectorCoordinateSchema>;
export type Pixel = z.infer<typeof PixelSchema>;
export type Sector = z.infer<typeof SectorSchema>;

// Sector bounds
export interface SectorBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Sector update operation
export interface SectorUpdate {
  sectorX: number;
  sectorY: number;
  pixels: Array<{
    localX: number; // 0-255 within sector
    localY: number; // 0-255 within sector
    r: number;
    g: number;
    b: number;
    a: number;
  }>;
}