# PRD: Read Mode

## Overview
Distraction-free view for reviewing code with larger font and hidden UI chrome.

## Problem Statement
When reviewing or studying snippets, the editing UI (sidebar, list, controls) is distracting. Users need a focused reading experience.

## Goals
- Clean, distraction-free code viewing
- Larger, more readable font
- Easy toggle in and out

## User Stories
1. As a user, I want to focus on reading code without distractions
2. As a user, I want larger text when reviewing snippets
3. As a user, I want to quickly toggle read mode on/off

## Functional Requirements

### Read Mode View
- Hide sidebar and snippet list
- Hide edit controls (save button, language picker)
- Center code in viewport
- Increase font size (configurable, default +20%)
- Optional line numbers

### Toggle Methods
- Keyboard shortcut: Cmd+Shift+R
- Button in snippet header
- Menu option: View → Read Mode
- Escape to exit

### Read Mode Features
- Syntax highlighting preserved
- Scroll position preserved when toggling
- Copy still works (Cmd+C)
- Navigate to next/previous snippet with arrow keys

## Technical Considerations

### Implementation
```typescript
const [isReadMode, setReadMode] = useState(false);

// Increase editor font size
const readModeFontSize = baseFontSize * 1.2;

// Hide panels
<Sidebar className={isReadMode ? 'hidden' : ''} />
<SnippetList className={isReadMode ? 'hidden' : ''} />
```

### Keyboard Handling
Capture Escape key to exit read mode.
Arrow keys navigate snippets in read mode.

## UI/UX Design

### Read Mode Layout
```
┌─────────────────────────────────────────────────┐
│                                          [Exit] │
│                                                 │
│     function greet(name) {                      │
│       return `Hello, ${name}!`;                 │
│     }                                           │
│                                                 │
│                                                 │
│              ← Prev    •    Next →              │
└─────────────────────────────────────────────────┘
```

### Styling
- Subtle dark overlay on edges (vignette effect)
- Snippet title at top (smaller, muted)
- Navigation hints at bottom

## Out of Scope
- Read mode for multiple snippets
- Presentation/slideshow mode
- Print optimization

## Success Metrics
- Toggle is instantaneous
- Font is noticeably more readable
- No accidental edits in read mode

## Priority
💤 Low - Nice polish, not critical
