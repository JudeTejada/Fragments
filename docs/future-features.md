# Future Features & UX Ideas

Core enhancements that align with the Things 3 aesthetic and local-first snippet management philosophy.

---

## 1. Snippet Organization

### Folders / Collections
- Group snippets into nested folders (like Things' Areas/Projects)
- Drag-and-drop to reorganize
- Folder icons with customizable colors

### Smart Lists
- Auto-generated lists based on rules:
  - "Recently Modified" (last 7 days)
  - "Frequently Used" (track copy count)
  - "Uncategorized" (no tags)

### Quick Access / Pinned Snippets
- Pin important snippets to top of list
- Keyboard shortcut to jump to pinned items

---

## 2. Code Editing & Viewing

### Fragment Support
- Multiple code blocks within a single snippet
- Tab or accordion view for related code pieces (e.g., HTML + CSS + JS together)

### Code Folding
- Collapse/expand code regions in the editor
- Persistent fold state per snippet

### Diff View
- Compare current snippet with previous version
- Side-by-side or inline diff display

### Read Mode
- Distraction-free view for reviewing code
- Larger font, hidden UI chrome

---

## 3. Quick Actions & Productivity

### Quick Switcher (Cmd+K)
- Spotlight-style search across all snippets
- Fuzzy matching on title, content, tags
- Recent items at top

### Quick Add (Cmd+Shift+N)
- Minimal floating dialog to capture code fast
- Auto-detect language from clipboard
- Add tags inline, then dismiss

### Duplicate Snippet
- One-click duplicate with " (copy)" suffix
- Context menu and keyboard shortcut (Cmd+D)

### Template Snippets
- Mark snippets as templates
- "New from Template" action
- Variable placeholders: `{{name}}`, `{{date}}`

---

## 4. Clipboard & Integration

### Clipboard History
- Track recent copies from the app
- Quick re-copy from history list

### Paste with Formatting Options
- Plain text
- Markdown code block (with language)
- HTML `<pre><code>` format

### Import from Clipboard
- Detect code in clipboard, prompt to save
- Auto-suggest language

---

## 5. Version History

### Auto-Versioning
- Save snapshots on significant changes
- Lightweight diff storage (delta compression)

### Version Timeline
- Visual timeline of changes per snippet
- One-click restore to previous version

### Trash / Recently Deleted
- Soft delete with 30-day retention
- Bulk restore or permanent delete

---

## 6. Enhanced Tagging

### Tag Colors
- Assign colors to tags for visual distinction
- Color dots in tag chips and sidebar

### Nested Tags
- Hierarchical tags: `frontend/react`, `backend/node`
- Collapsible tag tree in sidebar

### Tag Aliases
- Multiple names map to same tag
- Helps with typos and variations

---

## 7. UX Micro-Improvements

### Drag-and-Drop Reordering
- Custom sort order for snippet list
- Drag handle appears on hover

### Keyboard Navigation
- Arrow keys to move through list
- Enter to open, Escape to deselect
- Tab to switch between panes

### Batch Operations
- Multi-select with Shift/Cmd+click ✓ (already done)
- Extend actions: bulk tag, bulk move to folder

### Inline Rename
- Double-click title to rename in-place
- Auto-select text, Enter to save

### Snippet Peek
- Spacebar to preview snippet in modal
- Quick look without leaving current position

---

## 8. Search Enhancements

### Search Operators
- `lang:javascript` – filter by language
- `tag:react` – filter by tag
- `updated:7d` – updated in last 7 days

### Search History
- Recent searches in dropdown
- Pin frequent searches

### Highlight Matches
- Highlight search terms in snippet list
- Highlight in code editor when viewing

---

## 9. Visual Polish (Things 3 Alignment)

### Selection Pill Animation
- Smooth sliding indicator like Things' sidebar
- Subtle spring physics

### Empty States
- Friendly illustrations for empty lists
- Contextual CTAs ("Add your first snippet")

### Skeleton Loading
- Subtle loading placeholders
- Consistent with Things' calm transitions

### Focus Mode
- Hide sidebar and list, show only detail
- Toggle with keyboard shortcut (Cmd+\)

---

## 10. Data & Portability

### Import Options
- Import from massCode JSON
- Import from GitHub Gists (local file)
- Import from plain text/markdown files

### Export Formats
- Markdown with frontmatter
- JSON (full data)
- Individual `.snippet` files

### Backup Reminders
- Optional reminder to export backup
- Configurable interval (weekly/monthly)

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Quick Switcher (Cmd+K) | High | Medium | 🔥 High |
| Quick Add Dialog | High | Low | 🔥 High |
| Duplicate Snippet | Medium | Low | 🔥 High |
| Tag Colors | Medium | Low | 🔥 High |
| Keyboard Navigation | High | Medium | 🔥 High |
| Folders/Collections | High | High | ⚡ Medium |
| Fragment Support | Medium | High | ⚡ Medium |
| Version History | Medium | High | ⚡ Medium |
| Search Operators | Medium | Medium | ⚡ Medium |
| Template Snippets | Medium | Medium | ⚡ Medium |
| Smart Lists | Low | Medium | 💤 Low |
| Clipboard History | Low | Medium | 💤 Low |
| Import Options | Low | High | 💤 Low |

---

## Notes

- All features remain **local-first** – no cloud sync or accounts
- Prioritize **keyboard-driven** workflows
- Maintain **Things 3 aesthetic** – calm, minimal, intentional
- Focus on **daily driver** use case for developers
