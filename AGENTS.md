# Repository Guidelines

## Project Structure & Module Organization
- App follows Electron + React + TypeScript. Runtime code lives in `src`: `src/main` (Electron main process, app lifecycle), `src/preload` (secure IPC bridges), and `src/renderer` (React UI).
- Static assets and installer resources go in `resources`. Packaged artifacts land in `out/` after builds; temporary build scaffolding uses `build/`.
- Configuration roots: `electron.vite.config.ts`, `tsconfig*.json`, `eslint.config.mjs`, and Tailwind setup in `components.json`.

## Build, Test, and Development Commands
- `npm install` — install dependencies (runs `electron-builder install-app-deps` postinstall).
- `npm dev` — start Vite dev servers + Electron for live reload during UI/IPC work.
- `npm start` — preview a built bundle in Electron using `electron-vite preview`.
- `npm build` — type-check both targets then bundle for production. Platform-specific: `npm build:mac`, `npm build:win`, `npm build:linux`; add `:unpack` to produce unpacked dirs.
- Quality: `npm lint` for ESLint, `npm format` for Prettier, `npm typecheck` (or `typecheck:node` / `typecheck:web`) for TS safety.

## Coding Style & Naming Conventions
- Use TypeScript everywhere; prefer typed IPC contracts in preload and avoid `any`.
- Prettier controls formatting (2-space indent, single quotes/semicolons per config); run `npm format` before committing.
- React components and files: PascalCase for components (`MyPanel.tsx`), camelCase for utilities, SCREAMING_SNAKE_CASE for constants.
- Tailwind classes go inline; use `tailwind-merge` helpers to keep class lists tidy. Keep main/preload free of DOM APIs.

## Testing Guidelines
- No automated test suite is configured yet; rely on `npm typecheck` and `npm dev` for manual validation.
- When adding tests, colocate near source (e.g., `src/renderer/__tests__/Component.test.tsx`) and prefer vitest/react-testing-library patterns; mirror file names for clarity.
- For Electron flows, capture manual test notes in PRs (platform, steps, expected behavior) until automated coverage exists.

## Commit & Pull Request Guidelines
- Commit messages: concise, imperative summaries (e.g., `Add preload IPC for snippets`); include scope if helpful. Avoid bundling unrelated changes.
- PRs should describe intent, major changes, and testing performed; link issues when relevant. Include screenshots/GIFs for UI changes and list manual test steps for Electron flows.
- Keep diffs small and focused; run lint + typecheck before opening a PR to avoid CI churn.


## VERY IMPORTANT
please use COSS UI for the components i've already added all of it  renderere/src/components