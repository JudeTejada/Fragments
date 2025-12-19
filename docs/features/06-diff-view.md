# PRD: Diff View

## Overview
Compare the current snippet version with a previous version using side-by-side or inline diff display.

## Problem Statement
When reviewing changes or debugging modifications, users need to see what changed between versions. Currently no way to compare snippet states.

## Goals
- Visual diff between snippet versions
- Both side-by-side and inline views
- Easy navigation between changes

## User Stories
1. As a user, I want to see what changed in my snippet since last save
2. As a user, I want to compare with any previous version
3. As a user, I want to restore specific lines from old versions

## Functional Requirements

### Diff Modes
- **Side-by-side**: Two columns, old left, new right
- **Inline**: Single view with additions/deletions marked

### Diff Controls
- Version selector dropdown (requires Version History feature)
- Toggle between side-by-side and inline
- Navigate to next/previous change buttons

### Visual Indicators
- Green background for additions
- Red background for deletions
- Yellow/orange for modifications
- Line numbers for both versions

### Actions
- Copy from old version
- Revert specific lines
- Revert entire file to old version

## Technical Considerations

### Diff Library
Use `diff` npm package:

```typescript
import { diffLines, diffWords } from 'diff';

const changes = diffLines(oldContent, newContent);
```

### Integration with Version History
Depends on `14-version-history.md` for version storage.

Standalone mode: compare with "last saved" state (track original on snippet open).

## UI/UX Design

### Diff Panel
Could be:
1. Replace editor temporarily with diff view
2. Split editor horizontally
3. Modal/overlay diff viewer

### Controls
```
[< Prev Change] [Next Change >]  View: [Side-by-side ▼]
Comparing: [Current] vs [Dec 15, 2024 3:42 PM ▼]
```

### Styling
```css
.diff-added { background: rgba(46, 160, 67, 0.15); }
.diff-removed { background: rgba(248, 81, 73, 0.15); }
.diff-gutter-added { color: #2ea043; }
.diff-gutter-removed { color: #f85149; }
```

## Out of Scope
- Three-way merge
- Diff between two arbitrary snippets
- Diff export

## Dependencies
- Version History (feature #14) for full functionality
- Basic mode can work with "unsaved changes" comparison

## Success Metrics
- Diffs render correctly for all languages
- Navigation between changes is quick
- Users can restore old content easily

## Priority
⚡ Medium - Valuable with version history, limited standalone
