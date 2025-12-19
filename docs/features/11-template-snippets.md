# PRD: Template Snippets

## Overview
Mark snippets as templates with variable placeholders, enabling "New from Template" functionality.

## Problem Statement
Users recreate similar snippets repeatedly (boilerplate code, config files). They need a way to create new snippets from pre-defined templates with customizable placeholders.

## Goals
- Define reusable templates with variables
- Create new snippets quickly from templates
- Simple placeholder syntax

## User Stories
1. As a user, I want to mark a snippet as a template
2. As a user, I want to define placeholders like `{{name}}` in my template
3. As a user, I want to create new snippets from templates and fill in placeholders

## Functional Requirements

### Template Definition
- Toggle "Use as Template" in snippet settings
- Template snippets have distinct icon in list
- Placeholder syntax: `{{variableName}}`

### Built-in Variables
| Variable | Value |
|----------|-------|
| `{{date}}` | Current date (YYYY-MM-DD) |
| `{{time}}` | Current time (HH:MM) |
| `{{datetime}}` | Combined date and time |
| `{{clipboard}}` | Current clipboard content |

### Create from Template
- Right-click template → "New from Template"
- Or: "New Snippet" dialog → dropdown to select template
- Shows form to fill in custom placeholders
- Preview of result before creating

### Template Management
- Filter to show only templates
- Template section in sidebar (optional)

## Technical Considerations

### Database Schema
```sql
ALTER TABLE snippets ADD COLUMN is_template INTEGER DEFAULT 0;
```

### Placeholder Parsing
```typescript
function extractPlaceholders(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = content.matchAll(regex);
  return [...new Set([...matches].map(m => m[1]))];
}

function fillPlaceholders(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key === 'date') return new Date().toISOString().split('T')[0];
    if (key === 'time') return new Date().toTimeString().split(' ')[0].slice(0, 5);
    return values[key] ?? match;
  });
}
```

## UI/UX Design

### Template Creation Dialog
```
┌─────────────────────────────────────────┐
│ New from Template: React Component      │
├─────────────────────────────────────────┤
│                                         │
│ componentName: [MyComponent         ]   │
│ description:   [A new component     ]   │
│                                         │
├─────────────────────────────────────────┤
│ Preview:                                │
│ ┌─────────────────────────────────────┐ │
│ │ // A new component                  │ │
│ │ export function MyComponent() {     │ │
│ │   return <div>MyComponent</div>;    │ │
│ │ }                                   │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│              [Cancel] [Create Snippet]  │
└─────────────────────────────────────────┘
```

### Template Badge
Show "Template" badge or icon (📋) in snippet list.

## Out of Scope
- Template inheritance
- Conditional sections in templates
- Template sharing/import

## Success Metrics
- Templates reduce repeated work
- Placeholder filling is intuitive
- No confusion between templates and regular snippets

## Priority
⚡ Medium - Good productivity boost, moderate effort
