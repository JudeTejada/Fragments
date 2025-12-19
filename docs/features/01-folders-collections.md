# PRD: Folders & Collections

## Overview
Enable users to organize snippets into nested folders/collections, similar to Things 3's Areas and Projects hierarchy.

## Problem Statement
Currently, snippets can only be organized via tags. Users with large snippet libraries need hierarchical organization to group related snippets logically (e.g., by project, client, or domain).

## Goals
- Provide hierarchical folder structure for snippet organization
- Support drag-and-drop reorganization
- Maintain Things 3 aesthetic with clean folder UI

## User Stories
1. As a user, I want to create folders to group related snippets together
2. As a user, I want to nest folders inside other folders for hierarchical organization
3. As a user, I want to drag snippets into folders to organize them
4. As a user, I want to customize folder appearance with colors/icons

## Functional Requirements

### Folder Management
- Create new folder with name
- Rename folder inline
- Delete folder (with confirmation if contains snippets)
- Nest folders up to 3 levels deep

### Folder UI
- Display in sidebar below "All Snippets" and "Favorites"
- Collapsible folder tree with expand/collapse arrows
- Folder count badge showing snippet count
- Optional color dot for visual distinction

### Snippet-Folder Association
- Snippet belongs to one folder (or none for "Inbox")
- Drag-and-drop to move between folders
- Context menu "Move to..." option

### Navigation
- Click folder to filter list to that folder's snippets
- Include nested snippets option (show all children)

## Technical Considerations

### Database Schema
```sql
-- New table
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES folders(id),
  color TEXT,
  sort_order INTEGER,
  created_at TEXT,
  updated_at TEXT
);

-- Add to snippets table
ALTER TABLE snippets ADD COLUMN folder_id TEXT REFERENCES folders(id);
```

### IPC Handlers
- `folders:list` - Get folder tree
- `folders:create` - Create folder
- `folders:update` - Rename, recolor, move
- `folders:delete` - Delete folder
- `snippets:move` - Move snippet to folder

## UI/UX Design

### Sidebar
- Folder section with tree view
- Indentation for nested folders
- Drag handle on hover for reordering
- Right-click context menu

### Interactions
- Single click: filter to folder
- Double click: rename inline
- Drag snippet row onto folder: move snippet
- Drag folder onto folder: nest folder

## Out of Scope
- Shared folders / collaboration
- Folder templates
- Automatic folder rules

## Success Metrics
- Users can organize 100+ snippets efficiently
- Folder navigation feels fast and responsive
- Drag-and-drop works reliably

## Priority
⚡ Medium - High impact but higher effort
