# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
npm run dev           # Start development server with hot reload
npm run start         # Preview production build
```

### Building
```bash
npm run build         # Build for current platform
npm run build:win     # Build for Windows
npm run build:mac     # Build for macOS
npm run build:linux   # Build for Linux
npm run build:unpack  # Build without packaging (outputs to dist/)
```

### Code Quality
```bash
npm run format        # Format code with Prettier
npm run lint          # Lint with ESLint
npm run typecheck     # Run all TypeScript checks
npm run typecheck:node # Check main/preload TypeScript
npm run typecheck:web  # Check renderer TypeScript
```

### Installation
```bash
npm install           # Install dependencies
```

## Architecture

Electron application with React and TypeScript using electron-vite.

### Project Structure
- **src/main/index.ts** - Electron main process (creates windows, handles app lifecycle)
- **src/preload/index.ts** - Preload script (exposes safe APIs to renderer via contextBridge)
- **src/renderer/** - React UI (Vite-powered renderer process)
  - **src/renderer/src/App.tsx** - Root React component
  - **src/renderer/src/components/ui/** - Reusable UI components library
  - **src/renderer/src/lib/utils.ts** - Utility functions

### Key Technologies
- **@electron-toolkit** - Electron utilities (main, preload, utils packages)
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **electron-updater** - Auto-update support (configured in electron-builder.yml)
- **electron-vite** - Build tool (dev server, bundling)

### TypeScript Configuration
- **tsconfig.node.json** - Main/preload process configuration
- **tsconfig.web.json** - Renderer process configuration
- Path aliases configured: `@/` and `@renderer/` map to `src/renderer/src/`

### Build Configuration
- **electron-builder.yml** - Packaging settings for Win/Mac/Linux
- **electron.vite.config.ts** - Vite/Electron build configuration
- Uses npm mirror: https://npmmirror.com/mirrors/electron/

## Code Style

### ESLint Configuration (eslint.config.mjs)
- Extends @electron-toolkit/eslint-config-ts
- React plugins: react, react-hooks, react-refresh
- Prettier integration via @electron-toolkit/eslint-config-prettier
- Ignores: node_modules, dist, out

### Prettier Configuration (.prettierrc.yaml)
- Single quotes
- No semicolons
- Print width: 100
- No trailing comma

## Development Notes

- Auto-hides menu bar by default (autoHideMenuMenuBar: true)
- Window shortcuts optimized for development (F12 to toggle DevTools)
- Auto-updates configured (generic provider, placeholder URL in electron-builder.yml)
- Context isolation enabled (secure IPC via contextBridge)
- Sandboxing disabled (sandbox: false)
