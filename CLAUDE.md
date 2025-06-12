# PixelCanvas v0.7 - Claude Development Guide

## Project Overview
PixelCanvas is a real-time collaborative pixel art canvas platform built with Next.js, TypeScript, and Supabase. The project follows Test-Driven Development (TDD) principles and uses a monorepo structure managed by pnpm.

**Version**: 0.7.0  
**Blueprint**: v0.7  
**Last Updated**: December 6, 2025

## Architecture Overview

### Monorepo Structure
```
pixelcanvas/
├── apps/
│   ├── web/           # Next.js frontend
│   └── api/           # Express.js API server
├── packages/
│   ├── shared/        # Shared utilities & offline queue
│   ├── types/         # TypeScript definitions
│   ├── canvas-engine/ # Canvas rendering engine
│   └── test-utils/    # Testing utilities
├── supabase/
│   └── migrations/    # Database migrations
└── e2e/              # End-to-end tests
```

### Technology Stack
- **Frontend**: Next.js 14 + App Router, React 18, TypeScript 5.3
- **Backend**: Express.js + Socket.io for real-time features
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS + Radix UI components
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **Build System**: Turbo monorepo with pnpm workspaces

## Core Features Implementation

### 1. Sector-Based Tiling System
The canvas uses a 256×256 pixel sector system for optimal performance:

```typescript
// Sector coordinates calculation
function getSectorCoordinates(x: number, y: number) {
  return {
    sectorX: Math.floor(x / 256),
    sectorY: Math.floor(y / 256)
  };
}
```

### 2. Offline Queue with IndexedDB
Located in `packages/shared/src/offline/`:

```typescript
import { OfflineQueue } from '@pixelcanvas/shared/offline';

const queue = new OfflineQueue({
  dbName: 'pixelcanvas-offline',
  maxRetries: 3,
  batchSize: 50
});

// Queue pixel updates when offline
await queue.enqueue({
  type: 'PIXEL_UPDATE',
  data: { x: 100, y: 150, color: '#FF0000' }
});
```

### 3. Real-time Collaboration
- WebSocket connections via Socket.io
- Operational Transform for conflict resolution
- User presence and cursor tracking
- Optimistic updates with rollback capability

## Development Workflow

### 1. TDD Approach
Always write tests first:

```typescript
// 1. Write the test
describe('PixelCanvas', () => {
  it('should update pixel color', async () => {
    const canvas = new PixelCanvas();
    await canvas.updatePixel(10, 20, '#FF0000');
    expect(canvas.getPixel(10, 20)).toBe('#FF0000');
  });
});

// 2. Implement the feature
// 3. Refactor if needed
```

### 2. Package Scripts
```bash
# Development
pnpm dev              # Start all services
pnpm build            # Build all packages

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests
pnpm test:e2e         # End-to-end tests
pnpm test:watch       # Watch mode

# Quality
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript checks
pnpm format           # Format code

# Database
pnpm db:migrate       # Run migrations
pnpm db:reset         # Reset database
```

### 3. Git Workflow
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- All tests must pass before committing
- Husky pre-commit hooks enforce code quality

## Database Schema (Migration 001_pixels.sql)

### Core Tables
- **canvases**: Canvas metadata and settings
- **sectors**: 256×256 pixel sectors with compressed data
- **pixels**: Individual pixel tracking
- **layers**: Layer system for advanced editing
- **pixel_history**: Undo/redo functionality
- **user_sessions**: Real-time presence tracking

### Spatial Partitioning
Uses PostGIS for efficient spatial queries and sector-based data storage.

## Testing Strategy

### Test Organization
```
apps/web/tests/
├── unit/           # Component & utility tests
├── integration/    # Feature workflow tests
└── e2e/           # User journey tests
```

### Test Utilities (`packages/test-utils/`)
- Custom render functions with providers
- Mock canvas context helpers
- Common test setup and teardown
- Jest-DOM matchers for Vitest

### Coverage Requirements
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Performance Optimizations

### Canvas Rendering
1. **Sector-based loading**: Only load visible 256×256 sectors
2. **Dirty rectangle optimization**: Only redraw changed areas
3. **Virtual viewport**: Efficient infinite canvas scrolling
4. **WebGL acceleration**: Hardware-accelerated rendering

### Network Optimizations
1. **Delta compression**: Only send pixel changes
2. **Operation batching**: Group multiple changes
3. **Offline queue**: IndexedDB-backed operation storage
4. **WebSocket binary protocol**: Efficient data transfer

### State Management
1. **Zustand stores**: Lightweight state management
2. **React Query**: Server state caching and synchronization
3. **Structural sharing**: Immutable updates with shared references
4. **Memoization**: React.memo and useMemo optimizations

## Security Implementation

### Row Level Security (RLS)
- Canvas access control based on ownership/public status
- User session isolation
- Pixel update permissions

### Input Validation
- Zod schemas for all API inputs
- Client-side validation with server-side verification
- Rate limiting on pixel update endpoints

## CI/CD Pipeline

### GitHub Actions
- **CI**: Type checking, linting, unit/integration/E2E tests
- **Deploy**: Automated deployment to production
- **Coverage**: Codecov integration for test coverage

### Deployment Targets
- **Frontend**: Vercel (Next.js app)
- **API**: Railway/Docker deployment
- **Database**: Supabase managed PostgreSQL

## Common Patterns

### Component Structure
```typescript
import { describe, it, expect } from '@pixelcanvas/test-utils';

// 1. Test first
describe('PixelBrush', () => {
  it('should render with correct size', () => {
    // Test implementation
  });
});

// 2. Implementation
export const PixelBrush: FC<Props> = ({ size, color }) => {
  // Component logic
};
```

### Offline-First Operations
```typescript
import { OfflineQueue } from '@pixelcanvas/shared/offline';

const queue = new OfflineQueue();

// Always queue operations
await queue.enqueue({
  type: 'PIXEL_UPDATE',
  data: pixelData
});

// Handle online/offline sync
queue.setOnlineHandler(async (operations) => {
  await syncToServer(operations);
});
```

## Environment Setup

### Required Tools
- Node.js 18+
- pnpm 8.10+
- PostgreSQL 15+ (or Supabase)

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# API
API_URL=http://localhost:3001
SOCKET_URL=ws://localhost:3001

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

## Debugging Guide

### Common Issues
1. **Canvas not rendering**: Check WebGL support and context creation
2. **Offline sync failing**: Verify IndexedDB permissions and storage quota
3. **Real-time updates delayed**: Check WebSocket connection and network throttling
4. **Test failures**: Ensure proper cleanup in test utilities

### Debug Tools
- React DevTools for component inspection
- Network tab for WebSocket monitoring
- IndexedDB inspector for offline queue
- Supabase dashboard for database queries

## Performance Monitoring

### Key Metrics
- Canvas render time (target: <16ms for 60fps)
- Network latency for pixel updates (target: <100ms)
- IndexedDB operation time (target: <50ms)
- Memory usage during long sessions

### Monitoring Tools
- Browser Performance API
- Custom metrics collection
- Supabase performance insights
- Real User Monitoring (RUM)

## Version History

### v0.7.0 (Current)
- Sector-based tiling system
- Offline queue with IndexedDB
- Enhanced testing utilities
- Improved TypeScript configuration
- Comprehensive migration scripts

## Resources

### Documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript)
- [Vitest Testing Framework](https://vitest.dev/)
- [Playwright E2E Testing](https://playwright.dev/)
- [Turbo Monorepo](https://turbo.build/repo/docs)

### Internal References
- `/supabase/migrations/001_pixels.sql` - Database schema
- `/packages/shared/src/offline/` - Offline queue implementation
- `/packages/test-utils/` - Testing utilities
- `/.github/workflows/` - CI/CD configuration

---

**Note**: This document reflects the v0.7 blueprint specifications. Always refer to the latest version for current implementation details.