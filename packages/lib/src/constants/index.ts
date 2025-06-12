// Shared constants

export const CANVAS_DEFAULTS = {
  WIDTH: 64,
  HEIGHT: 64,
  BACKGROUND_COLOR: '#FFFFFF',
  GRID_COLOR: '#E5E5E5',
} as const;

export const PIXEL_SIZE = 10; // Default pixel size in the editor
export const MAX_CANVAS_SIZE = 1024;
export const MIN_CANVAS_SIZE = 8;

export const COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  RED: '#FF0000',
  GREEN: '#00FF00',
  BLUE: '#0000FF',
  YELLOW: '#FFFF00',
  CYAN: '#00FFFF',
  MAGENTA: '#FF00FF',
} as const;

export const TOOLS = {
  PENCIL: 'pencil',
  ERASER: 'eraser',
  FILL: 'fill',
  EYEDROPPER: 'eyedropper',
  MOVE: 'move',
} as const;