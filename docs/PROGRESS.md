# MVP Implementation Progress

> This document tracks the implementation progress of the Code Snippets MVP.
> Last updated: 2025-12-16

---

## Status Legend
- ✅ Complete
- 🚧 In Progress
- ⏳ Pending
- ❌ Blocked

---

## Phase 1: Foundations

| Task | Status | Notes |
|------|--------|-------|
| Install better-sqlite3 | ✅ | Installed with electron-rebuild |
| DB bootstrap on app start | ✅ | Via `initDatabase()` in main |
| Create migrations | ✅ | Tables: snippets, tags, snippet_tags, settings |
| DB path per OS | ✅ | Uses `app.getPath('userData')` |
| IPC handler setup | ✅ | All CRUD handlers registered |
| Preload API methods | ✅ | Typed API exposed to renderer |
| Type definitions | ✅ | Updated `index.d.ts` |

---

## Phase 2: Core CRUD

| Task | Status | Notes |
|------|--------|-------|
| SnippetRepository | ✅ | list, get, create, update, delete, search |
| TagRepository | ✅ | list, findOrCreateMany |
| SettingsRepository | ✅ | getAll, update |
| IPC: snippets:list | ✅ | |
| IPC: snippets:get | ✅ | |
| IPC: snippets:create | ✅ | |
| IPC: snippets:update | ✅ | |
| IPC: snippets:delete | ✅ | |
| IPC: snippets:search | ✅ | |
| IPC: tags:list | ✅ | |
| useSnippetsList hook | ✅ | Via SnippetContext with API calls |
| useSnippetDetail hook | ✅ | Via SnippetContext with API calls |
| Mutation hooks | ✅ | create/update/delete via SnippetContext |

---

## Phase 3: UI Layout (UI-First Approach)

| Task | Status | Notes |
|------|--------|-------|
| 3-pane layout container | ✅ | `App.tsx` with SidebarProvider |
| Left sidebar (fixed width) | ✅ | `SnippetSidebar.tsx` |
| Middle list (flex) | ✅ | `SnippetList.tsx` |
| Right detail (flex) | ✅ | `SnippetDetail.tsx` |
| Sidebar search input | ✅ | Controlled query state |
| "All snippets" item | ✅ | With count badge |
| Tag list with counts | ✅ | With selection state |
| SnippetRow component | ✅ | Title, language badge, tags, relative time |
| Selected/hover states | ✅ | Rounded, soft highlight |
| Empty states | ✅ | Using Empty composable pattern |
| Detail header | ✅ | Editable title, language select, tag chips |
| Code editor | ✅ | CodeMirror with syntax highlighting |
| Notes textarea | ✅ | Using Textarea component |
| Auto-save logic | ✅ | Debounced with "Saved" indicator |

---

## Phase 1: Foundations (Next)

| Task | Status | Notes |
|------|--------|-------|
| Settings model | ⏳ | |
| IPC: settings:get | ⏳ | |
| IPC: settings:update | ⏳ | |
| Settings UI | ⏳ | |
| backup:export IPC | ⏳ | |

---

## Phase 5: Visual Polish

| Task | Status | Notes |
|------|--------|-------|
| Things 3 theme tokens | ⏳ | |
| Spacing/hover refinement | ⏳ | |
| Micro-interactions | ⏳ | |
| "Saved" feedback | ⏳ | |
| Keyboard shortcuts | ⏳ | Cmd+N, Cmd+F |

---

## Decisions & Notes

### Open Questions
1. **Code Editor**: Codemirror vs Monaco - awaiting decision
2. **Build Order**: Follow MVP.md order or UI-first for visual progress?

### Dependencies to Install
- `better-sqlite3` - SQLite driver
- Code editor library (TBD)
