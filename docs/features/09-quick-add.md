# PRD: Quick Add Dialog

## Overview
Minimal floating dialog for rapidly capturing code snippets with auto-detection and minimal friction.

## Problem Statement
Creating a new snippet requires navigating to the app, clicking "New", filling in fields. This interrupts workflow when users just want to save code quickly.

## Goals
- Capture code in 3 seconds or less
- Auto-detect language from clipboard
- Minimal required fields

## User Stories
1. As a user, I want to save code from my clipboard instantly
2. As a user, I want the language auto-detected
3. As a user, I want to add tags inline without extra clicks

## Functional Requirements

### Activation
- Keyboard shortcut: Cmd+Shift+N (even when app not focused, via global shortcut)
- Menu: File → Quick Add
- System tray icon click (if tray enabled)

### Auto-Detection
- Read clipboard content on open
- Detect language from content patterns:
  - `import React` → JavaScript/TypeScript
  - `def ` or `import ` with indentation → Python
  - `SELECT`, `FROM` → SQL
  - `<html>`, `<div>` → HTML
- Pre-fill code editor with clipboard content

### Dialog Fields
- **Code** (pre-filled from clipboard)
- **Title** (auto-generate from first line or function name)
- **Language** (auto-detected, dropdown to override)
- **Tags** (inline chip input, optional)

### Actions
- Save (Cmd+Enter): save and close
- Save & Open: save and navigate to full editor
- Cancel (Escape): discard

## Technical Considerations

### Global Shortcut
Register global keyboard shortcut via Electron:

```typescript
globalShortcut.register('CommandOrControl+Shift+N', () => {
  createQuickAddWindow();
});
```

### Language Detection
```typescript
function detectLanguage(content: string): string {
  if (/import\s+React/.test(content)) return 'typescript';
  if (/^def\s+\w+/.test(content)) return 'python';
  if (/SELECT\s+.+FROM/i.test(content)) return 'sql';
  if (/<\/?[a-z][\s\S]*>/i.test(content)) return 'html';
  return 'plaintext';
}
```

### Quick Add Window
- Separate smaller BrowserWindow
- Frameless or minimal frame
- Always on top
- Auto-close after save

## UI/UX Design

### Dialog Layout
```
┌─────────────────────────────────────┐
│ Quick Add                       [×] │
├─────────────────────────────────────┤
│ Title: [Auto-generated title    ]   │
│ Language: [JavaScript ▼]            │
│ Tags: [react] [hooks] [+]           │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ function useDebounce(value) {  │ │
│ │   const [debounced, set...     │ │
│ │ }                              │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│     [Cancel]  [Save ⌘↵]             │
└─────────────────────────────────────┘
```

### Styling
- Compact, ~400px wide
- Rounded corners, subtle shadow
- Code area with syntax highlighting
- Keyboard hints on buttons

## Out of Scope
- Quick add from browser extension
- Quick add from CLI
- Multiple snippets at once

## Success Metrics
- Time from shortcut to saved: < 3 seconds
- Language detection accuracy > 80%
- Zero required manual input for simple captures

## Priority
🔥 High - Critical for daily capture workflow
