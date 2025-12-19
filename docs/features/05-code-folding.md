# PRD: Code Folding

## Overview
Enable collapsing and expanding code regions in the editor for easier navigation of long snippets.

## Problem Statement
Long snippets are hard to navigate. Users need to collapse irrelevant sections to focus on specific parts of the code.

## Goals
- Fold/unfold code blocks by clicking gutter
- Persist fold state per snippet
- Support language-aware folding

## User Stories
1. As a user, I want to collapse functions I'm not currently working on
2. As a user, I want my fold state preserved when I return to a snippet
3. As a user, I want to fold all / unfold all quickly

## Functional Requirements

### Fold Triggers
- Click fold icon in gutter
- Keyboard shortcuts (Cmd+Opt+[ to fold, Cmd+Opt+] to unfold)
- Fold All / Unfold All commands

### Foldable Regions
- Functions and methods
- Classes
- Objects and arrays (multi-line)
- Block comments
- Import statements (grouped)
- Language-specific blocks (if/else, try/catch)

### Fold Display
- Collapsed indicator: `▶` or `...`
- Line count badge on collapsed region
- Preview of first line when collapsed

### Persistence
- Save fold state per snippet
- Restore on next open
- Optional: reset fold state on edit

## Technical Considerations

### CodeMirror Integration
CodeMirror 6 has built-in folding support via `@codemirror/language`:

```typescript
import { foldGutter, foldKeymap } from '@codemirror/language';

const extensions = [
  foldGutter(),
  keymap.of(foldKeymap),
];
```

### State Persistence
```typescript
interface SnippetFoldState {
  snippetId: string;
  foldedRanges: Array<{ from: number; to: number }>;
}
```

Store in localStorage or database settings.

## UI/UX Design

### Gutter Icons
- `▼` for expanded foldable region
- `▶` for collapsed region
- Icons appear on hover or always (configurable)

### Collapsed View
```
▶ function calculateTotal(...) { ... } // 15 lines
```

## Out of Scope
- Custom fold regions via comments
- Fold by indentation level
- Fold specific language constructs only

## Success Metrics
- Folding works for all supported languages
- State persists correctly
- No performance issues with large files

## Priority
⚡ Medium - Depends on CodeMirror capabilities
