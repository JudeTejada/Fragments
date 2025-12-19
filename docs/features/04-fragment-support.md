# PRD: Fragment Support

## Overview
Allow multiple code blocks (fragments) within a single snippet, enabling related code pieces to stay together.

## Problem Statement
Developers often have related code that belongs together (HTML + CSS + JS, or frontend + backend). Currently requires separate snippets, losing the logical connection.

## Goals
- Keep related code fragments together in one snippet
- Support different languages per fragment
- Easy navigation between fragments

## User Stories
1. As a user, I want to store HTML, CSS, and JS together as one snippet
2. As a user, I want each fragment to have its own language highlighting
3. As a user, I want to copy individual fragments or all at once

## Functional Requirements

### Fragment Structure
- Snippet contains 1+ fragments
- Each fragment has: name, language, content
- Default: single unnamed fragment (backward compatible)

### Fragment Management
- Add new fragment button
- Delete fragment (confirm if has content)
- Reorder fragments via drag
- Rename fragment inline

### Editor View
- Tabbed interface for multiple fragments
- Or accordion/collapsible sections
- Active fragment indicator
- Fragment name + language in tab

### Copy Behavior
- Copy current fragment: Cmd+C
- Copy all fragments: Cmd+Shift+C
- Copy with labels option (includes fragment names)

## Technical Considerations

### Database Schema
```sql
CREATE TABLE fragments (
  id TEXT PRIMARY KEY,
  snippet_id TEXT NOT NULL REFERENCES snippets(id),
  name TEXT,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER,
  created_at TEXT,
  updated_at TEXT
);

-- Migration: move existing content to fragments table
```

### Data Model
```typescript
interface Fragment {
  id: string;
  name?: string;
  language: string;
  content: string;
  sortOrder: number;
}

interface Snippet {
  // ... existing fields
  fragments: Fragment[];
}
```

## UI/UX Design

### Tab View (Recommended)
```
[index.html] [styles.css] [script.js] [+]
┌─────────────────────────────────────────┐
│ <div class="container">                 │
│   <h1>Hello World</h1>                  │
│ </div>                                  │
└─────────────────────────────────────────┘
```

### Interactions
- Click tab to switch fragment
- Double-click tab to rename
- Drag tabs to reorder
- Right-click tab for delete option
- [+] button adds new fragment

## Out of Scope
- Live preview of combined fragments
- Fragment linking/references
- Fragment templates

## Success Metrics
- Multi-file snippets easy to create
- No confusion vs single-fragment snippets
- Copy operations work intuitively

## Priority
⚡ Medium - Moderate effort, good organization value
