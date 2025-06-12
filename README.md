# PixelCanvas

A real-time collaborative pixel art canvas platform.

## Features

- 🎨 Real-time collaborative pixel art creation
- 🔄 Live cursor tracking and user presence
- 📐 Infinite canvas with smooth pan and zoom
- 🎯 Multiple drawing tools (pencil, eraser, fill, eyedropper)
- 📚 Layer management system
- 💾 Auto-save and version history
- 🔐 User authentication and permissions
- 🌐 Public and private canvases

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, Socket.io
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand, React Query
- **Testing**: Vitest, Playwright
- **Build Tools**: pnpm, TSup, Vite

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pixelcanvas.git
cd pixelcanvas

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development servers
pnpm dev
```

### Project Structure

```
pixelcanvas/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # Express.js backend API
├── packages/
│   ├── shared/       # Shared types and utilities
│   ├── ui/           # Reusable UI components
│   └── canvas-engine/ # Canvas rendering engine
├── docs/             # Documentation
└── scripts/          # Build and deployment scripts
```

## Development

This project follows Test-Driven Development (TDD) principles. Always write tests before implementing features.

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.