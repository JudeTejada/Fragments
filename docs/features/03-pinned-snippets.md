# PRD: Pinned Snippets

## Overview
Allow users to pin important snippets to the top of the list for quick access.

## Problem Statement
Frequently used snippets get buried in long lists. Users need a way to keep important snippets easily accessible without searching.

## Goals
- Quick access to most important snippets
- Simple pin/unpin interaction
- Works across all views (folders, tags, search)

## User Stories
1. As a user, I want to pin my most-used snippets to the top
2. As a user, I want to quickly unpin snippets when no longer needed
3. As a user, I want pinned snippets visible in any view

## Functional Requirements

### Pin/Unpin Actions
- Pin via context menu
- Pin via keyboard shortcut (Cmd+P when snippet selected)
- Pin icon/button in snippet detail header
- Toggle behavior (pin again to unpin)

### Display
- Pinned snippets appear at top of list
- Visual indicator (pin icon) on pinned items
- Subtle separator between pinned and unpinned
- Pinned section collapsible (optional)

### Behavior
- Pinned state persists across sessions
- Works in all views (All, Folder, Tag, Search)
- Pinned snippets maintain their own sort order

## Technical Considerations

### Database Schema
```sql
ALTER TABLE snippets ADD COLUMN is_pinned INTEGER DEFAULT 0;
ALTER TABLE snippets ADD COLUMN pinned_at TEXT;
```

### Query Modification
```sql
SELECT * FROM snippets
ORDER BY is_pinned DESC, pinned_at DESC, updated_at DESC;
```

## UI/UX Design

### List View
- Pin icon (📌) on left of pinned rows
- Light background tint for pinned section
- "Pinned" label as section header

### Interactions
- Right-click → "Pin to Top" / "Unpin"
- Cmd+P shortcut
- Drag to reorder within pinned section

## Out of Scope
- Pin to specific position
- Pin groups/bulk pin
- Pin expiration

## Success Metrics
- Pin/unpin action < 1 click
- Pinned snippets always visible at top
- No performance impact with many pins

## Priority
🔥 High - Low effort, high daily value
