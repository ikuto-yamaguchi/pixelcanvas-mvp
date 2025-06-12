// Mock implementations for testing

export const mockCanvas = {
  id: 'test-canvas-id',
  name: 'Test Canvas',
  width: 100,
  height: 100,
  ownerId: 'test-user-id',
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockPixel = {
  id: 'test-pixel-id',
  canvasId: 'test-canvas-id',
  x: 10,
  y: 20,
  color: '#FF0000',
  placedBy: 'test-user-id',
  placedAt: new Date().toISOString(),
};

export const mockUser = {
  id: 'test-user-id',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: 'https://example.com/avatar.png',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};