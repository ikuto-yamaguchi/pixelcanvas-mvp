# 🎨 PixelCanvas MVP

A real-time collaborative pixel art canvas platform with offline-first architecture.

## ✨ Features

- **Real-time Collaboration**: Multiple users can draw simultaneously
- **Offline-First**: Works without internet, syncs when reconnected
- **Sector-Based Rendering**: Efficient 256×256 pixel tiling system
- **TypeScript**: Full type safety throughout the codebase
- **Modern Stack**: Next.js 14, Supabase, pnpm monorepo

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Real-time**: Supabase Realtime & WebSockets
- **State**: Zustand + React Query
- **Styling**: Tailwind CSS
- **Monorepo**: pnpm workspaces
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions

### Project Structure
```
pixelcanvas/
├── apps/
│   ├── web/           # Next.js frontend
│   └── api/           # Express.js API server
├── packages/
│   ├── shared/        # Offline queue & utilities
│   ├── types/         # TypeScript definitions
│   ├── canvas-engine/ # Rendering engine
│   ├── lib/           # Core utilities & Supabase client
│   └── test-utils/    # Testing utilities
├── supabase/
│   └── migrations/    # Database schema
└── e2e/              # End-to-end tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Supabase CLI

### 1. Clone & Install
```bash
git clone https://github.com/ikuto-yamaguchi/pixelcanvas-mvp.git
cd pixelcanvas-mvp
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Database Setup
```bash
# Start local Supabase
pnpm db:start

# Run migrations
pnpm db:migrate

# Generate TypeScript types
pnpm generate:types
```

### 4. Development
```bash
# Start all services
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 🗃️ Database Schema

The database uses a sector-based approach for efficient pixel storage:

- **canvases**: Canvas metadata and settings
- **sectors**: 256×256 pixel sectors with compressed data
- **pixels**: Individual pixel tracking for undo/redo
- **layers**: Layer system for advanced editing
- **user_sessions**: Real-time presence tracking

## 🧪 Testing

### Test Coverage
- **Unit Tests**: 24 tests passing
- **Coverage Target**: 80% (branches, functions, lines, statements)
- **Integration Tests**: Offline queue, sector management
- **E2E Tests**: User workflows with Playwright

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# E2E tests
pnpm test:e2e
```

## 📦 Key Packages

### Shared Utilities (`packages/shared`)
- **Offline Queue**: IndexedDB-based operation queuing
- **Type Definitions**: Shared TypeScript types
- **Utilities**: Common helper functions

### Canvas Engine (`packages/canvas-engine`)
- **Sector Management**: 256×256 pixel tiling
- **Rendering Pipeline**: Efficient canvas updates
- **Spatial Indexing**: Fast pixel lookup

### Test Utils (`packages/test-utils`)
- **Mock Utilities**: Canvas, IndexedDB, WebSocket mocks
- **Test Helpers**: Custom render functions
- **Setup Configuration**: Vitest environment

## 🔧 Development Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm build            # Build all packages

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:e2e         # End-to-end tests

# Database
pnpm db:start         # Start Supabase locally
pnpm db:migrate       # Run migrations
pnpm db:reset         # Reset database
pnpm generate:types   # Generate TS types

# Quality
pnpm lint             # ESLint (zero warnings)
pnpm typecheck        # TypeScript check
pnpm format           # Prettier format
```

## 🚀 Deployment

### Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run migrations: `pnpm db:migrate`
3. Update environment variables

### Vercel (Frontend)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Railway (API)
1. Connect repository
2. Set PORT environment variable
3. Deploy from GitHub

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with tests
4. Ensure all tests pass: `pnpm test`
5. Commit with conventional commits: `feat: add amazing feature`
6. Push and create Pull Request

### Code Quality
- **Zero Lint Warnings**: ESLint strict mode
- **Type Safety**: TypeScript strict mode
- **Test Coverage**: 80% minimum
- **Conventional Commits**: Required for PR

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: See [CLAUDE.md](CLAUDE.md) for development guide
- **Issues**: [GitHub Issues](https://github.com/ikuto-yamaguchi/pixelcanvas-mvp/issues)
- **Supabase**: [Database Dashboard](https://supabase.com/dashboard)

---

Built with ❤️ using [Claude Code](https://claude.ai/code)