.2 Local database (SQLite)
Requirements

Single local SQLite DB file under user data dir.

Tables: snippets, tags, snippet_tags, settings.​

Tasks

Choose library

Use better-sqlite3 from main process.​

DB bootstrap

On app start:

Resolve DB path (per OS).

If not exists, create DB + run migrations.

Migrations

snippets:

id (string/uuid), title, language, content (text), notes (text nullable), created_at, updated_at.

tags:

id, name (unique).

snippet_tags:

snippet_id, tag_id.

settings:

key (string), value (text/json).

Repository layer

SnippetRepository:

list(), get(id), create(data), update(id, data), delete(id), search(query, tagIds?).

TagRepository:

list(), findOrCreateMany(names).

SettingsRepository:

getAll(), update(partial).

3.3 Snippet management
Requirements

Full CRUD.

Tags on snippets.

Search by title/content/tags.

Tasks

IPC handlers (main)

snippets:list

Input: optional { tagIds?: string[] }.

Output: array of snippets (id, title, language, tags, updated_at).

snippets:get

Input: { id }.

Output: full snippet (all fields) + tags.

snippets:create

Input: { title, language, content, notes?, tags: string[] }.

Steps:

Upsert tags.

Insert snippet.

Insert snippet_tags.

Output: created snippet.

snippets:update

Input: { id, title?, language?, content?, notes?, tags?: string[] }.

Steps:

Update snippet.

Re‑sync tags if provided.

snippets:delete

Input: { id }.

Steps:

Delete snippet and snippet_tags.

snippets:search

Input: { query: string, tagIds?: string[] }.

Output: matching snippets.

tags:list

Output: all tags with snippet counts.

Renderer data hooks

useSnippetsList({ query, tagIds }).

useSnippetDetail(id).

Mutation hooks: useCreateSnippet, useUpdateSnippet, useDeleteSnippet.

UI components

Left sidebar:

Search input (controlled query state).

“All snippets” item.

Tag list:

Name + count, selected state.

Middle list:

Scrollable list of snippet rows:

Title.

Subline: language, tags (inline), updated time.

Right detail:

Header:

Editable title.

Language dropdown.

Tags input (chips, free text).

Body:

Code editor with syntax highlighting.

Notes textarea.

3.4 Settings & backup
Requirements

Minimal settings.

Library export.

Tasks

Settings model

Keys for now:

db_backup_last_path (optional).

IPC:

settings:get → { ... }.

settings:update → merge.

Settings UI

Section “Data”:

Show DB path (read‑only).

Button “Export library”.

Backup IPC: backup:export

Input: { destinationDir: string }.

Implementation:

Copy DB file to destination with timestamped name.

Return success/error → show toast.

4. UI / UX – Things 3 × massCode
Goal: 3‑pane layout like massCode, but with the clean, airy, Things 3 aesthetics.​

4.1 Global theme
Tasks

Set up design tokens / Tailwind config:

Colors:

Main background: off‑white/light grey.

Sidebar: slightly tinted panel.

Primary accent (blue).

Typography:

Base font (Inter/SF Pro).

Heading sizes.

Radius & shadows:

Larger radius on panels/buttons, subtle shadows (Things‑like).​

Implement light theme only for MVP.

4.2 Layout & components
Tasks

Main layout

Flex container:

Sidebar (fixed width).

List (flex).

Detail (flex).

Sidebar

Top search input:

Filters snippets by title/content.

“All snippets” row.

Tag section:

Tag list, each clickable filter.

Highlight selected tag.

Snippet list (middle)

Reusable SnippetRow:

Title (prominent).

Subline with language, tags (up to 2–3), updated time.

Selected state: rounded soft highlight.

Empty states:

“No snippets yet” → CTA: “Create your first snippet”.

“No results” when search active.

Detail view (right)

Header:

Title field (inline editable).

Language dropdown.

Tag chips input.

Code editor area:

Embedded in a card (rounded, slightly raised).

Notes field below editor.

Save behavior:

Auto‑save on blur / pause (no manual save button).

Micro‑interactions

Smooth fade/slide when switching selected snippet.

Subtle hover states on rows and sidebar items.

Tiny “Saved” label that shows briefly after updates are persisted.

Shortcuts (optional but nice)

Cmd/Ctrl + N: new snippet.

Cmd/Ctrl + F: focus search.

5. Non‑Functional
All snippet/tag/settings data stays local; no remote HTTP calls at all.

Handle 1k+ snippets without UI lag (basic pagination or virtual list later if needed).

Basic error handling:

DB open failures.

Export errors.

Packaging:

Use electron‑builder/forge to produce installers for macOS & Windows.​

6. Recommended Build Order (for you / AI agent)
Foundations

Electron shell + renderer build.

SQLite integration + migrations.

IPC wiring.

Core CRUD

Snippet repository + IPC.

Basic 3‑pane UI with list + detail, editable snippet.

Tags & search

Tag model, sidebar filters.

Search wired to DB query.

Settings & backup

Settings model/UI.

Export DB.

Visual polish

Apply Things 3‑inspired theme.

Refine spacing, hover/selected states, micro‑interactions.

This keeps your MVP clean and shippable, and you’ll be perfectly set up to bolt on AI later as a separate phase.

## very important please ues the components I created from 