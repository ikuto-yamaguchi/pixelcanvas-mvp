import { describe, it, expect } from 'vitest';
import {
  worldToSector,
  worldToLocal,
  sectorToWorld,
  getSectorBounds,
  isCoordinateInSector,
  getSectorsInRegion,
  localToIndex,
  indexToLocal,
  setPixelInSector,
  getPixelFromSector,
  createEmptySector
} from './utils';
import { SECTOR_SIZE } from './types';

describe('Sector Utils', () => {
  describe('coordinate conversion', () => {
    it('should convert world coordinates to sector coordinates', () => {
      expect(worldToSector(0, 0)).toEqual({ sectorX: 0, sectorY: 0 });
      expect(worldToSector(255, 255)).toEqual({ sectorX: 0, sectorY: 0 });
      expect(worldToSector(256, 256)).toEqual({ sectorX: 1, sectorY: 1 });
      expect(worldToSector(512, 768)).toEqual({ sectorX: 2, sectorY: 3 });
    });

    it('should convert world coordinates to local coordinates', () => {
      expect(worldToLocal(0, 0)).toEqual({ x: 0, y: 0 });
      expect(worldToLocal(255, 255)).toEqual({ x: 255, y: 255 });
      expect(worldToLocal(256, 256)).toEqual({ x: 0, y: 0 });
      expect(worldToLocal(300, 400)).toEqual({ x: 44, y: 144 });
    });

    it('should convert sector and local coordinates to world coordinates', () => {
      expect(sectorToWorld(0, 0, 0, 0)).toEqual({ x: 0, y: 0 });
      expect(sectorToWorld(0, 0, 255, 255)).toEqual({ x: 255, y: 255 });
      expect(sectorToWorld(1, 1, 0, 0)).toEqual({ x: 256, y: 256 });
      expect(sectorToWorld(2, 3, 44, 144)).toEqual({ x: 556, y: 912 });
    });
  });

  describe('sector bounds', () => {
    it('should get correct sector bounds', () => {
      const bounds = getSectorBounds(1, 2);
      expect(bounds).toEqual({
        minX: 256,
        minY: 512,
        maxX: 511,
        maxY: 767
      });
    });

    it('should check if coordinate is in sector', () => {
      expect(isCoordinateInSector(300, 400, 1, 1)).toBe(true);
      expect(isCoordinateInSector(100, 200, 1, 1)).toBe(false);
      expect(isCoordinateInSector(256, 256, 1, 1)).toBe(true);
      expect(isCoordinateInSector(511, 511, 1, 1)).toBe(true);
      expect(isCoordinateInSector(512, 512, 1, 1)).toBe(false);
    });
  });

  describe('sector regions', () => {
    it('should get sectors in a region', () => {
      const sectors = getSectorsInRegion(200, 200, 600, 600);
      // Region spans from (200,200) to (600,600)
      // Sector 0: 0-255, Sector 1: 256-511, Sector 2: 512-767
      // So we get 3x3 = 9 sectors total
      expect(sectors).toHaveLength(9);
      expect(sectors).toContainEqual({ sectorX: 0, sectorY: 0 });
      expect(sectors).toContainEqual({ sectorX: 1, sectorY: 0 });
      expect(sectors).toContainEqual({ sectorX: 2, sectorY: 0 });
      expect(sectors).toContainEqual({ sectorX: 0, sectorY: 1 });
      expect(sectors).toContainEqual({ sectorX: 1, sectorY: 1 });
      expect(sectors).toContainEqual({ sectorX: 2, sectorY: 1 });
      expect(sectors).toContainEqual({ sectorX: 0, sectorY: 2 });
      expect(sectors).toContainEqual({ sectorX: 1, sectorY: 2 });
      expect(sectors).toContainEqual({ sectorX: 2, sectorY: 2 });
    });

    it('should get single sector for small regions', () => {
      const sectors = getSectorsInRegion(100, 100, 200, 200);
      expect(sectors).toHaveLength(1);
      expect(sectors).toContainEqual({ sectorX: 0, sectorY: 0 });
    });
  });

  describe('pixel operations', () => {
    it('should convert local coordinates to array index', () => {
      expect(localToIndex(0, 0)).toBe(0);
      expect(localToIndex(1, 0)).toBe(4);
      expect(localToIndex(0, 1)).toBe(SECTOR_SIZE * 4);
      expect(localToIndex(255, 255)).toBe((SECTOR_SIZE * SECTOR_SIZE - 1) * 4);
    });

    it('should convert array index to local coordinates', () => {
      expect(indexToLocal(0)).toEqual({ x: 0, y: 0 });
      expect(indexToLocal(4)).toEqual({ x: 1, y: 0 });
      expect(indexToLocal(SECTOR_SIZE * 4)).toEqual({ x: 0, y: 1 });
    });

    it('should create empty sector', () => {
      const sector = createEmptySector();
      expect(sector).toBeInstanceOf(Uint8ClampedArray);
      expect(sector.length).toBe(SECTOR_SIZE * SECTOR_SIZE * 4);
    });

    it('should set and get pixels in sector', () => {
      const pixels = createEmptySector();
      
      setPixelInSector(pixels, 10, 20, 255, 128, 64, 200);
      const pixel = getPixelFromSector(pixels, 10, 20);
      
      expect(pixel).toEqual({
        x: 10,
        y: 20,
        r: 255,
        g: 128,
        b: 64,
        a: 200
      });
    });
  });
});