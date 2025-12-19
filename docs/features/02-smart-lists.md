# PRD: Smart Lists

## Overview
Auto-generated dynamic lists based on rules, providing quick access to snippets matching specific criteria.

## Problem Statement
Users often want to quickly access snippets based on patterns (recently used, frequently copied, uncategorized). Currently requires manual search or tag filtering.

## Goals
- Provide pre-built smart lists for common use cases
- Enable quick access to contextually relevant snippets
- Zero configuration required

## User Stories
1. As a user, I want to see recently modified snippets quickly
2. As a user, I want to find snippets I use frequently
3. As a user, I want to identify uncategorized snippets that need organization

## Functional Requirements

### Built-in Smart Lists
| List | Rule | Sort |
|------|------|------|
| Recently Modified | Updated in last 7 days | By updated_at desc |
| Frequently Used | Copy count > 5 | By copy_count desc |
| Uncategorized | No tags AND no folder | By created_at desc |
| Long Snippets | Content > 100 lines | By line_count desc |

### Display
- Show in sidebar above or below regular folders
- Distinct icon for smart lists (e.g., magic wand)
- Count badge with matching snippet count
- Non-editable (system-defined)

### Behavior
- Click to filter snippet list
- Updates dynamically as snippets change
- Empty smart lists can be hidden (optional setting)

## Technical Considerations

### Copy Count Tracking
```sql
ALTER TABLE snippets ADD COLUMN copy_count INTEGER DEFAULT 0;
```

Track copy events via IPC and increment counter.

### Query Examples
```sql
-- Recently Modified
SELECT * FROM snippets
WHERE updated_at > datetime('now', '-7 days')
ORDER BY updated_at DESC;

-- Uncategorized
SELECT * FROM snippets
WHERE id NOT IN (SELECT snippet_id FROM snippet_tags)
AND folder_id IS NULL;
```

## UI/UX Design
- Smart lists section in sidebar with subtle divider
- Italic or different font weight to distinguish from folders
- Tooltip explaining the smart list criteria

## Out of Scope
- User-defined custom smart lists
- Complex boolean rules
- Smart list notifications

## Success Metrics
- Smart lists load in < 100ms
- Users discover uncategorized snippets
- Reduces time to find recent work

## Priority
💤 Low - Nice to have, lower impact
