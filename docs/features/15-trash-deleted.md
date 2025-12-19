# PRD: Trash / Recently Deleted

## Overview
Soft delete snippets with 30-day retention period, allowing recovery of accidentally deleted items.

## Problem Statement
Deleting a snippet is permanent and immediate. Users who accidentally delete cannot recover their work.

## Goals
- Non-destructive delete by default
- Easy recovery within retention period
- Clear trash when storage needed

## User Stories
1. As a user, I want to recover a snippet I accidentally deleted
2. As a user, I want to know how long until deleted items are purged
3. As a user, I want to permanently delete items immediately if needed

## Functional Requirements

### Soft Delete Behavior
- Delete moves snippet to Trash, not database delete
- Snippet marked with `deleted_at` timestamp
- Hidden from normal views

### Trash View
- Accessible from sidebar
- Shows all trashed snippets
- Displays "days until deletion" for each
- Empty state when no trashed items

### Retention
- Default: 30 days
- Configurable in settings
- Auto-purge runs on app start

### Trash Actions
- Restore: move back to original location
- Delete Permanently: immediate hard delete
- Empty Trash: delete all permanently

## Technical Considerations

### Database Schema
```sql
ALTER TABLE snippets ADD COLUMN deleted_at TEXT;
```

### Query Modification
All snippet queries add `WHERE deleted_at IS NULL`.

### Auto-Purge
```typescript
async function purgeOldTrash() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  await db.run(`
    DELETE FROM snippets
    WHERE deleted_at IS NOT NULL
    AND deleted_at < ?
  `, [cutoff.toISOString()]);
}
```

### On App Start
```typescript
app.on('ready', async () => {
  await purgeOldTrash();
});
```

## UI/UX Design

### Sidebar Item
```
├─ All Snippets
├─ Favorites ★
├─ ...
├─ ───────────
├─ 🗑️ Trash (3)
```

### Trash View
```
┌─────────────────────────────────────────────────┐
│ Trash                          [Empty Trash]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📄 Old API helper                              │
│    Deleted 2 days ago • Purges in 28 days      │
│    [Restore] [Delete Permanently]              │
│                                                 │
│ 📄 Unused CSS snippet                          │
│    Deleted 15 days ago • Purges in 15 days     │
│    [Restore] [Delete Permanently]              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Delete Confirmation (Permanent)
```
┌─────────────────────────────────────┐
│ ⚠️ Permanently Delete?             │
│                                     │
│ This cannot be undone.              │
│                                     │
│        [Cancel] [Delete Forever]    │
└─────────────────────────────────────┘
```

## Out of Scope
- Trash storage limits
- Selective purge (by age or size)
- Trash for tags/folders

## Success Metrics
- Zero permanent accidental deletions
- Trash doesn't bloat database
- Restore is quick and reliable

## Priority
🔥 High - Low effort, high safety value
