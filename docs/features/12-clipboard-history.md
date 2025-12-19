# PRD: Clipboard History

## Overview
Track recent copies made from the app, allowing quick re-copy of previously copied snippets.

## Problem Statement
After copying multiple snippets, users lose track of what they copied. System clipboard only holds one item.

## Goals
- Track copies made from within the app
- Quick access to re-copy recent items
- Non-intrusive, doesn't monitor system clipboard

## User Stories
1. As a user, I want to see what snippets I recently copied
2. As a user, I want to quickly re-copy something I copied earlier
3. As a user, I want to clear my clipboard history

## Functional Requirements

### Tracking
- Only track copies initiated from the app
- Store: snippet ID, copied content, timestamp
- Limit to last 20 items
- Persist across sessions (optional)

### Clipboard Panel
- Accessible via sidebar icon or Cmd+Shift+V
- List of recent copies with preview
- Click to copy again
- Clear history button

### Privacy
- History stored locally only
- Clear on app quit (optional setting)
- Exclude from backup export (optional)

## Technical Considerations

### Data Storage
```typescript
interface ClipboardHistoryItem {
  id: string;
  snippetId: string;
  snippetTitle: string;
  content: string;
  copiedAt: string;
}

// Store in localStorage or SQLite
```

### Integration Point
Hook into existing copy functionality:

```typescript
function copyToClipboard(content: string, snippetId: string) {
  navigator.clipboard.writeText(content);
  addToClipboardHistory({ snippetId, content });
}
```

## UI/UX Design

### Clipboard Dropdown
```
┌─────────────────────────────────────┐
│ Clipboard History             [⌫]  │
├─────────────────────────────────────┤
│ ▸ React useEffect hook              │
│   const [deb...  •  2 min ago       │
├─────────────────────────────────────┤
│ ▸ SQL join example                  │
│   SELECT u.*...  •  15 min ago      │
├─────────────────────────────────────┤
│ ▸ Git alias config                  │
│   [alias]...  •  1 hour ago         │
└─────────────────────────────────────┘
```

### Interactions
- Click item to copy again
- Hover to see full preview
- Click ⌫ to clear history

## Out of Scope
- System-wide clipboard monitoring
- Clipboard sync across devices
- Clipboard formatting options

## Success Metrics
- Users can find recent copies quickly
- No privacy concerns
- Minimal memory footprint

## Priority
💤 Low - Nice to have, niche use case
