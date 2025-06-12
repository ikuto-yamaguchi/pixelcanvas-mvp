import { 
  SECTOR_SIZE, 
  BYTES_PER_PIXEL, 
  Coordinate, 
  SectorCoordinate, 
  SectorBounds,
  Pixel 
} from './types';

/**
 * Convert world coordinates to sector coordinates
 */
export function worldToSector(x: number, y: number): SectorCoordinate {
  return {
    sectorX: Math.floor(x / SECTOR_SIZE),
    sectorY: Math.floor(y / SECTOR_SIZE)
  };
}

/**
 * Convert world coordinates to local sector coordinates (0-255)
 */
export function worldToLocal(x: number, y: number): Coordinate {
  return {
    x: x % SECTOR_SIZE,
    y: y % SECTOR_SIZE
  };
}

/**
 * Convert sector and local coordinates to world coordinates
 */
export function sectorToWorld(
  sectorX: number, 
  sectorY: number, 
  localX: number, 
  localY: number
): Coordinate {
  return {
    x: sectorX * SECTOR_SIZE + localX,
    y: sectorY * SECTOR_SIZE + localY
  };
}

/**
 * Get the bounds of a sector in world coordinates
 */
export function getSectorBounds(sectorX: number, sectorY: number): SectorBounds {
  const minX = sectorX * SECTOR_SIZE;
  const minY = sectorY * SECTOR_SIZE;
  
  return {
    minX,
    minY,
    maxX: minX + SECTOR_SIZE - 1,
    maxY: minY + SECTOR_SIZE - 1
  };
}

/**
 * Check if a world coordinate is within a sector
 */
export function isCoordinateInSector(
  worldX: number, 
  worldY: number, 
  sectorX: number, 
  sectorY: number
): boolean {
  const bounds = getSectorBounds(sectorX, sectorY);
  return (
    worldX >= bounds.minX && 
    worldX <= bounds.maxX &&
    worldY >= bounds.minY && 
    worldY <= bounds.maxY
  );
}

/**
 * Get sectors that intersect with a rectangular region
 */
export function getSectorsInRegion(
  minX: number, 
  minY: number, 
  maxX: number, 
  maxY: number
): SectorCoordinate[] {
  const sectors: SectorCoordinate[] = [];
  
  const startSector = worldToSector(minX, minY);
  const endSector = worldToSector(maxX, maxY);
  
  for (let sectorX = startSector.sectorX; sectorX <= endSector.sectorX; sectorX++) {
    for (let sectorY = startSector.sectorY; sectorY <= endSector.sectorY; sectorY++) {
      sectors.push({ sectorX, sectorY });
    }
  }
  
  return sectors;
}

/**
 * Convert local coordinates to pixel array index
 */
export function localToIndex(localX: number, localY: number): number {
  return (localY * SECTOR_SIZE + localX) * BYTES_PER_PIXEL;
}

/**
 * Convert pixel array index to local coordinates
 */
export function indexToLocal(index: number): Coordinate {
  const pixelIndex = index / BYTES_PER_PIXEL;
  return {
    x: pixelIndex % SECTOR_SIZE,
    y: Math.floor(pixelIndex / SECTOR_SIZE)
  };
}

/**
 * Create an empty sector pixel array
 */
export function createEmptySector(): Uint8ClampedArray {
  return new Uint8ClampedArray(SECTOR_SIZE * SECTOR_SIZE * BYTES_PER_PIXEL);
}

/**
 * Set a pixel in a sector's pixel array
 */
export function setPixelInSector(
  pixels: Uint8ClampedArray,
  localX: number,
  localY: number,
  r: number,
  g: number,
  b: number,
  a: number = 255
): void {
  const index = localToIndex(localX, localY);
  pixels[index] = r;
  pixels[index + 1] = g;
  pixels[index + 2] = b;
  pixels[index + 3] = a;
}

/**
 * Get a pixel from a sector's pixel array
 */
export function getPixelFromSector(
  pixels: Uint8ClampedArray,
  localX: number,
  localY: number
): Pixel {
  const index = localToIndex(localX, localY);
  return {
    x: localX,
    y: localY,
    r: pixels[index],
    g: pixels[index + 1],
    b: pixels[index + 2],
    a: pixels[index + 3]
  };
}

/**
 * Fill a sector with a solid color
 */
export function fillSector(
  pixels: Uint8ClampedArray,
  r: number,
  g: number,
  b: number,
  a: number = 255
): void {
  for (let i = 0; i < pixels.length; i += BYTES_PER_PIXEL) {
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = a;
  }
}

/**
 * Copy pixels from one sector to another
 */
export function copySector(
  source: Uint8ClampedArray,
  destination: Uint8ClampedArray
): void {
  destination.set(source);
}

/**
 * Compare two sectors for equality
 */
export function sectorsEqual(
  sector1: Uint8ClampedArray,
  sector2: Uint8ClampedArray
): boolean {
  if (sector1.length !== sector2.length) return false;
  
  for (let i = 0; i < sector1.length; i++) {
    if (sector1[i] !== sector2[i]) return false;
  }
  
  return true;
}

/**
 * Get the checksum of a sector for version control
 */
export function getSectorChecksum(pixels: Uint8ClampedArray): number {
  let checksum = 0;
  for (let i = 0; i < pixels.length; i++) {
    checksum = (checksum + pixels[i]) % 0xFFFFFFFF;
  }
  return checksum;
}

/**
 * Compress sector data (simple RLE compression)
 */
export function compressSector(pixels: Uint8ClampedArray): Uint8ClampedArray {
  const compressed: number[] = [];
  let i = 0;
  
  while (i < pixels.length) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    
    let count = 1;
    let j = i + BYTES_PER_PIXEL;
    
    // Count consecutive identical pixels
    while (j < pixels.length && count < 255) {
      if (
        pixels[j] === r &&
        pixels[j + 1] === g &&
        pixels[j + 2] === b &&
        pixels[j + 3] === a
      ) {
        count++;
        j += BYTES_PER_PIXEL;
      } else {
        break;
      }
    }
    
    // Store count followed by RGBA values
    compressed.push(count, r, g, b, a);
    i = j;
  }
  
  return new Uint8ClampedArray(compressed);
}

/**
 * Decompress sector data
 */
export function decompressSector(compressed: Uint8ClampedArray): Uint8ClampedArray {
  const pixels = createEmptySector();
  let pixelIndex = 0;
  let compressedIndex = 0;
  
  while (compressedIndex < compressed.length) {
    const count = compressed[compressedIndex++];
    const r = compressed[compressedIndex++];
    const g = compressed[compressedIndex++];
    const b = compressed[compressedIndex++];
    const a = compressed[compressedIndex++];
    
    for (let i = 0; i < count; i++) {
      pixels[pixelIndex++] = r;
      pixels[pixelIndex++] = g;
      pixels[pixelIndex++] = b;
      pixels[pixelIndex++] = a;
    }
  }
  
  return pixels;
}