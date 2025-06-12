import { 
  Sector, 
  SectorUpdate,
  Pixel 
} from './types';
import {
  worldToSector,
  worldToLocal,
  createEmptySector,
  setPixelInSector,
  getPixelFromSector,
  getSectorsInRegion
} from './utils';

export interface SectorManagerConfig {
  maxCachedSectors?: number;
  autoSave?: boolean;
  saveInterval?: number;
}

export class SectorManager {
  private sectors = new Map<string, Sector>();
  private config: Required<SectorManagerConfig>;
  private saveTimer: NodeJS.Timeout | null = null;
  private dirtySectors = new Set<string>();

  constructor(config: SectorManagerConfig = {}) {
    this.config = {
      maxCachedSectors: config.maxCachedSectors || 100,
      autoSave: config.autoSave ?? true,
      saveInterval: config.saveInterval || 30000 // 30 seconds
    };

    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Get a sector key for caching
   */
  private getSectorKey(sectorX: number, sectorY: number): string {
    return `${sectorX},${sectorY}`;
  }

  /**
   * Get or create a sector
   */
  async getSector(canvasId: string, sectorX: number, sectorY: number): Promise<Sector> {
    const key = this.getSectorKey(sectorX, sectorY);
    
    if (this.sectors.has(key)) {
      return this.sectors.get(key)!;
    }

    // Try to load from storage first
    const stored = await this.loadSector(canvasId, sectorX, sectorY);
    if (stored) {
      this.sectors.set(key, stored);
      return stored;
    }

    // Create new empty sector
    const sector: Sector = {
      id: crypto.randomUUID(),
      canvasId,
      sectorX,
      sectorY,
      pixels: createEmptySector(),
      isDirty: false,
      lastModified: Date.now(),
      version: 1
    };

    this.sectors.set(key, sector);
    this.evictOldSectors();
    
    return sector;
  }

  /**
   * Update a pixel in the canvas
   */
  async updatePixel(
    canvasId: string,
    worldX: number,
    worldY: number,
    r: number,
    g: number,
    b: number,
    a: number = 255
  ): Promise<void> {
    const { sectorX, sectorY } = worldToSector(worldX, worldY);
    const { x: localX, y: localY } = worldToLocal(worldX, worldY);

    const sector = await this.getSector(canvasId, sectorX, sectorY);
    
    if (!sector.pixels) {
      sector.pixels = createEmptySector();
    }

    setPixelInSector(sector.pixels, localX, localY, r, g, b, a);
    
    sector.isDirty = true;
    sector.lastModified = Date.now();
    sector.version++;

    this.dirtySectors.add(this.getSectorKey(sectorX, sectorY));
  }

  /**
   * Get a pixel from the canvas
   */
  async getPixel(canvasId: string, worldX: number, worldY: number): Promise<Pixel> {
    const { sectorX, sectorY } = worldToSector(worldX, worldY);
    const { x: localX, y: localY } = worldToLocal(worldX, worldY);

    const sector = await this.getSector(canvasId, sectorX, sectorY);
    
    if (!sector.pixels) {
      return { x: localX, y: localY, r: 255, g: 255, b: 255, a: 255 };
    }

    return getPixelFromSector(sector.pixels, localX, localY);
  }

  /**
   * Apply batch updates to sectors
   */
  async applySectorUpdates(canvasId: string, updates: SectorUpdate[]): Promise<void> {
    for (const update of updates) {
      const sector = await this.getSector(canvasId, update.sectorX, update.sectorY);
      
      if (!sector.pixels) {
        sector.pixels = createEmptySector();
      }

      for (const pixel of update.pixels) {
        setPixelInSector(
          sector.pixels,
          pixel.localX,
          pixel.localY,
          pixel.r,
          pixel.g,
          pixel.b,
          pixel.a
        );
      }

      sector.isDirty = true;
      sector.lastModified = Date.now();
      sector.version++;

      this.dirtySectors.add(this.getSectorKey(update.sectorX, update.sectorY));
    }
  }

  /**
   * Get sectors in a viewport region
   */
  async getSectorsInViewport(
    canvasId: string,
    viewportX: number,
    viewportY: number,
    viewportWidth: number,
    viewportHeight: number
  ): Promise<Sector[]> {
    const sectorCoords = getSectorsInRegion(
      viewportX,
      viewportY,
      viewportX + viewportWidth,
      viewportY + viewportHeight
    );

    const sectors: Sector[] = [];
    for (const { sectorX, sectorY } of sectorCoords) {
      const sector = await this.getSector(canvasId, sectorX, sectorY);
      sectors.push(sector);
    }

    return sectors;
  }

  /**
   * Get all dirty sectors for syncing
   */
  getDirtySectors(): Sector[] {
    const dirty: Sector[] = [];
    
    for (const key of this.dirtySectors) {
      const sector = this.sectors.get(key);
      if (sector && sector.isDirty) {
        dirty.push(sector);
      }
    }

    return dirty;
  }

  /**
   * Mark sectors as clean after successful sync
   */
  markSectorsClean(sectorKeys: string[]): void {
    for (const key of sectorKeys) {
      const sector = this.sectors.get(key);
      if (sector) {
        sector.isDirty = false;
      }
      this.dirtySectors.delete(key);
    }
  }

  /**
   * Clear a specific sector from cache
   */
  clearSector(sectorX: number, sectorY: number): void {
    const key = this.getSectorKey(sectorX, sectorY);
    this.sectors.delete(key);
    this.dirtySectors.delete(key);
  }

  /**
   * Clear all cached sectors
   */
  clearAll(): void {
    this.sectors.clear();
    this.dirtySectors.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cachedSectors: this.sectors.size,
      dirtySectors: this.dirtySectors.size,
      maxCachedSectors: this.config.maxCachedSectors
    };
  }

  /**
   * Evict old sectors when cache is full
   */
  private evictOldSectors(): void {
    if (this.sectors.size <= this.config.maxCachedSectors) {
      return;
    }

    // Sort by last modified and evict oldest non-dirty sectors
    const sectorsArray = Array.from(this.sectors.entries());
    sectorsArray.sort(([, a], [, b]) => a.lastModified - b.lastModified);

    for (const [key, sector] of sectorsArray) {
      if (!sector.isDirty && this.sectors.size > this.config.maxCachedSectors) {
        this.sectors.delete(key);
      }
    }
  }

  /**
   * Load sector from storage (to be implemented by storage layer)
   */
  protected async loadSector(
    _canvasId: string, 
    _sectorX: number, 
    _sectorY: number
  ): Promise<Sector | null> {
    // This should be implemented by a storage adapter
    // For now, return null (sector doesn't exist)
    return null;
  }

  /**
   * Save sector to storage (to be implemented by storage layer)
   */
  protected async saveSector(_sector: Sector): Promise<void> {
    // This should be implemented by a storage adapter
    // For now, do nothing
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    this.saveTimer = setInterval(async () => {
      await this.saveAllDirty();
    }, this.config.saveInterval);
  }

  /**
   * Save all dirty sectors
   */
  private async saveAllDirty(): Promise<void> {
    const dirty = this.getDirtySectors();
    
    for (const sector of dirty) {
      try {
        await this.saveSector(sector);
        sector.isDirty = false;
        this.dirtySectors.delete(this.getSectorKey(sector.sectorX, sector.sectorY));
      } catch (error) {
        console.error('Failed to save sector:', error);
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    
    this.clearAll();
  }
}