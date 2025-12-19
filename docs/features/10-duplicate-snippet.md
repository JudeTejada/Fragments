# PRD: Duplicate Snippet

## Overview
One-click action to create a copy of an existing snippet with "(copy)" suffix.

## Problem Statement
Users often want to create variations of existing snippets. Currently requires creating new snippet and manually copying content.

## Goals
- Instant duplication with one action
- Clear naming for duplicates
- All metadata copied

## User Stories
1. As a user, I want to duplicate a snippet to create a variation
2. As a user, I want the duplicate clearly named so I know it's a copy
3. As a user, I want to edit the duplicate immediately after creating

## Functional Requirements

### Duplicate Action
- Accessible via:
  - Context menu: "Duplicate"
  - Keyboard shortcut: Cmd+D
  - Detail view header menu
- Creates new snippet with all content and metadata

### Copied Data
- Title → "Original Title (copy)"
- Language → same
- Content → same
- Notes → same
- Tags → same
- Folder → same (if folders feature exists)

### Post-Duplicate Behavior
- Select the new duplicate
- Navigate to detail view
- Focus on title field for renaming

## Technical Considerations

### IPC Handler
```typescript
// snippets:duplicate
async function duplicateSnippet(id: string): Promise<Snippet> {
  const original = await snippetRepository.get(id);
  const newSnippet = {
    ...original,
    id: generateId(),
    title: `${original.title} (copy)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return snippetRepository.create(newSnippet);
}
```

### Tag Handling
Copy tag associations:
```sql
INSERT INTO snippet_tags (snippet_id, tag_id)
SELECT $newSnippetId, tag_id FROM snippet_tags WHERE snippet_id = $originalId;
```

## UI/UX Design

### Context Menu
```
┌─────────────────┐
│ Copy            │
│ Duplicate  ⌘D   │
│ ───────────     │
│ Add to Favorites│
│ Move to...      │
│ ───────────     │
│ Delete          │
└─────────────────┘
```

### Feedback
- Brief toast: "Snippet duplicated"
- New snippet selected in list
- Scroll to new snippet if needed

## Out of Scope
- Duplicate multiple snippets
- Duplicate with template transformation
- Link between original and duplicate

## Success Metrics
- Duplication completes in < 100ms
- Clear which is original vs copy
- Intuitive for new users

## Priority
🔥 High - Very low effort, common use case
