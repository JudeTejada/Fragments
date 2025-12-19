# PRD: Paste Formatting Options

## Overview
Copy snippets in different formats: plain text, Markdown code block, or HTML.

## Problem Statement
Different contexts require different formats. Copying for Slack needs plain text, for GitHub needs Markdown, for email might need HTML.

## Goals
- Multiple format options when copying
- Quick access to preferred format
- Remember last used format (optional)

## User Stories
1. As a user, I want to copy code as Markdown for pasting in GitHub
2. As a user, I want to copy as plain text for terminal paste
3. As a user, I want to copy as HTML for rich text editors

## Functional Requirements

### Copy Formats
| Format | Output |
|--------|--------|
| Plain text | Raw code content |
| Markdown | \`\`\`language\n{code}\n\`\`\` |
| HTML | `<pre><code class="language-js">...</code></pre>` |

### Access Methods
- Copy button dropdown in detail view
- Context menu in snippet list: "Copy as..." submenu
- Keyboard shortcuts:
  - Cmd+C: last used format (default: plain)
  - Cmd+Shift+C: Markdown
  - Cmd+Alt+C: show format picker

### Preferences
- Default copy format setting
- Remember last used (optional)

## Technical Considerations

### Format Generation
```typescript
function formatSnippet(content: string, language: string, format: 'plain' | 'markdown' | 'html'): string {
  switch (format) {
    case 'plain':
      return content;
    case 'markdown':
      return `\`\`\`${language}\n${content}\n\`\`\``;
    case 'html':
      const escaped = escapeHtml(content);
      return `<pre><code class="language-${language}">${escaped}</code></pre>`;
  }
}
```

### Clipboard API
For HTML format, use Clipboard API with MIME types:

```typescript
const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
const textBlob = new Blob([plainContent], { type: 'text/plain' });
await navigator.clipboard.write([
  new ClipboardItem({
    'text/html': htmlBlob,
    'text/plain': textBlob,
  }),
]);
```

## UI/UX Design

### Copy Button Dropdown
```
[Copy ▼]
├─ Plain text     ⌘C
├─ Markdown       ⌘⇧C
└─ HTML           ⌘⌥C
```

### Settings
```
Copy Settings
├─ Default format: [Markdown ▼]
└─ ☐ Remember last used format
```

## Out of Scope
- Custom format templates
- Syntax-highlighted clipboard (RTF)
- Format with line numbers

## Success Metrics
- Users can get desired format in 1 click
- Markdown pastes correctly in GitHub/Notion
- HTML works in email clients

## Priority
💤 Low - Useful but narrow use case
