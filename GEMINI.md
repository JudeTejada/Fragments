# Code Snippets - Project Context

## Project Overview

**Code Snippets** is an Electron-based application for managing and organizing code snippets. It is built using modern web technologies including React, TypeScript, and TailwindCSS. The application allows users to create, edit, search, and tag code snippets, with support for various programming languages and syntax highlighting.

### Key Technologies

*   **Runtime:** Electron (Main and Renderer processes)
*   **Frontend:** React, TypeScript, TailwindCSS
*   **State Management:** Zustand
*   **Editor:** CodeMirror (`@uiw/react-codemirror`)
*   **Database:** SQLite (`better-sqlite3`)
*   **Build Tools:** `electron-vite`, `vite`, `electron-builder`
*   **Testing:** Playwright (E2E)
*   **Linting/Formatting:** ESLint, Prettier
*   **Auto-Update:** `electron-updater`

## Architecture

The project follows the standard Electron architecture with strict separation between Main and Renderer processes:

### Directory Structure

*   `src/main/`: **Main Process**
    *   `index.ts`: Application entry point. Handles window creation, app lifecycle, and IPC registration.
    *   `database/`: SQLite database initialization and migrations.
    *   `ipc/`: IPC handler definitions for communication with the renderer.
    *   `services/` & `repositories/`: Business logic and data access layers.
*   `src/preload/`: **Preload Scripts**
    *   `index.ts`: Exposes safe APIs to the renderer process via `contextBridge`.
*   `src/renderer/`: **Renderer Process (Frontend)**
    *   `src/main.tsx`: React entry point.
    *   `src/App.tsx`: Main application component.
    *   `src/components/`: Reusable UI components.
        *   `ui/`: **Core UI Library.** extensive set of reusable components (Button, Input, Dialog, etc.). **Always prefer using these components over raw HTML elements.**
    *   `src/hooks/`: Custom React hooks (e.g., for shortcuts, AI).
    *   `src/store/`: State management (likely Zustand, implied by usage).
*   `src/shared/`: **Shared Code**
    *   `types.ts`: TypeScript interfaces and constants shared between Main and Renderer.
*   `tests/e2e/`: **End-to-End Tests**
    *   Playwright test specs and utilities.

## Development

### Setup

1.  **Install Dependencies:**
    ```bash
    bun install
    ```

### Running the App

*   **Development Mode:**
    ```bash
    bun dev
    ```
    This runs `electron-vite dev`, starting the renderer with HMR and the main process.

### Building

*   **Production Build:**
    ```bash
    bun run build:mac   # For macOS
  bun run build:win   # For Windows
    bun run build:linux # For Linux
    ```

### Testing

*   **Run E2E Tests:**
    ```bash
    bun test:e2e
    ```
*   **Interactive Mode:**
    ```bash
    bun test:e2e:ui
    ```
*   **Type Checking:**
    ```bash
    bun run typecheck
    ```

## Coding Conventions

*   **UI Components:** **Strictly use the components in `src/renderer/src/components/ui`**. Do not create new base UI components unless necessary.
*   **Styling:** Use TailwindCSS utility classes.
*   **Components:** Functional components with TypeScript interfaces for props.
*   **State:** Use Zustand for global state.
*   **Async Operations:** Use `async/await` for asynchronous logic, especially for IPC calls.
*   **Type Safety:** Strict TypeScript usage. Shared types should be defined in `src/shared/types.ts`.
*   **Imports:** Use path aliases (e.g., `@renderer/`, `@shared/`) as defined in `electron.vite.config.ts`.
*   **Commit Messages:** Concise, imperative summaries (e.g., `Add preload IPC for snippets`).

## Key Features

*   **Snippet Management:** Create, Read, Update, Delete (CRUD) operations for snippets.
*   **Tagging:** Organize snippets with tags.
*   **Search:** Filter snippets by query and tags.
*   **Editor:** Syntax highlighting for multiple languages using CodeMirror.
*   **AI Integration:** Support for AI-powered features (Ollama).
*   **Quick Capture:** Global shortcut for quickly saving snippets.
*   **Settings:** Configurable application settings (stored in DB).
