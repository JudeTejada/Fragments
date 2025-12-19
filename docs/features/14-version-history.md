# PRD: Version History

## Overview
Automatically save snapshots of snippet changes, enabling version timeline and restore.

## Problem Statement
Users accidentally overwrite code or want to recover previous versions. Currently no undo beyond the current session.

## Goals
- Automatic version snapshots on significant changes
- Browse version history per snippet
- Easy restore to any previous version

## User Stories
1. As a user, I want to undo changes from yesterday
2. As a user, I want to see when and what changed
3. As a user, I want to restore a previous version without losing current

## Functional Requirements

### Auto-Versioning
- Save version snapshot on:
  - Manual save trigger (if added)
  - Content change > 10 lines
  - After 5 minutes of no edits (debounced)
- Include: content, title, language, tags, timestamp

### Version Storage
- Maximum versions per snippet: 50
- Oldest versions pruned first
- Total storage limit: configurable

### Version Timeline
- List versions with timestamps
- Preview difference from current
- Show change summary (lines added/removed)

### Restore Actions
- Restore version (replaces current, saves current as new version)
- Restore as new snippet (creates duplicate with old content)
- View version in read-only mode

## Technical Considerations

### Database Schema
```sql
CREATE TABLE snippet_versions (
  id TEXT PRIMARY KEY,
  snippet_id TEXT NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  title TEXT,
  language TEXT,
  content TEXT,
  notes TEXT,
  tags_json TEXT,  -- JSON array of tag names
  created_at TEXT NOT NULL
);

CREATE INDEX idx_versions_snippet ON snippet_versions(snippet_id, created_at DESC);
```

### Storage Optimization
Consider delta compression for content:
```typescript
import { createPatch, applyPatch } from 'diff';

// Store only diff from previous version
const patch = createPatch('snippet', previousContent, currentContent);
```

### Pruning Logic
```sql
DELETE FROM snippet_versions
WHERE snippet_id = $snippetId
AND id NOT IN (
  SELECT id FROM snippet_versions
  WHERE snippet_id = $snippetId
  ORDER BY created_at DESC
  LIMIT 50
);
```

## UI/UX Design

### Version Panel
Slide-out panel or modal accessible from snippet header.

```
┌─────────────────────────────────────────┐
│ Version History              [×]        │
├─────────────────────────────────────────┤
│ ● Current version                       │
│   └─ Just now                           │
│                                         │
│ ○ Dec 18, 2024 3:42 PM                  │
│   └─ +5 -2 lines                        │
│   └─ [View] [Restore]                   │
│                                         │
│ ○ Dec 17, 2024 11:15 AM                 │
│   └─ +12 -0 lines                       │
│   └─ [View] [Restore]                   │
│                                         │
│ ○ Dec 15, 2024 9:00 AM                  │
│   └─ Initial version                    │
│   └─ [View] [Restore]                   │
└─────────────────────────────────────────┘
```

### Timeline Visualization
Vertical timeline with dots for each version, connecting lines, relative timestamps.

## Out of Scope
- Branching/forking versions
- Merge versions
- Version annotations/comments
- Sync version history across devices

## Success Metrics
- Versions save automatically without user action
- Restore is non-destructive
- Storage stays within limits

## Priority
⚡ Medium - High value but moderate effort
