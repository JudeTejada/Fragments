9. Visual Design Theme (Things 3–inspired)
Design goal
Capture the calm, intentional, “nothing extra” feel of Things 3, applied to a massCode‑style 3‑pane layout for snippets.​

9.1 Visual Style
Overall vibe

Clean, airy, low‑noise UI with generous spacing and clear hierarchy.

Minimal visible chrome; content (titles, code, AI output) is the hero.​

Colors

Base: very light neutral background for main content (off‑white / very light gray).

Sidebar: slightly tinted, subtle “glass” look (soft blur or low‑contrast gradient) similar to Things’ sidebar.​

Accent: one primary blue for key actions (e.g., “New Snippet”, AI buttons), inspired by Things’ Magic Plus button.​

Code editor can support both light and dark themes, but default to a soft light theme to match Things’ feel.

Typography

Sans‑serif, humanist font (e.g., SF Pro, Inter).

Clear hierarchy:

Snippet titles: slightly larger, medium weight.

Metadata and tags: smaller, lighter.

Plenty of line spacing for readability, similar to Things’ task lists.​

Shape & depth

Increased corner radius on cards, modals, and buttons (Things 3 style).​

Very subtle shadows for floating elements (dialogs, quick add).

Use soft separators (spacing and light tints) instead of hard borders wherever possible.

9.2 Layout (Things 3 × massCode)
Structure

Keep three-column layout as per massCode: Library / List / Detail.​

Visually style it like Things 3:

Left sidebar: like Things’ project list (tags/folders).

Middle: like the task list (snippets list).

Right: detail view (code + AI panel), similar to expanded to‑do.​

Left sidebar

Soft tinted background with a hint of translucency.​

Sections:

“All Snippets”, “Favorites” (optional), and tag list.

Icons: simple, thin‑stroke, monochrome.

Middle list

Each snippet appears as a “card row”:

Title (biggest), language + tags + updated time below in lighter text.

Generous vertical spacing (like Things’ to‑do rows).​

Hover and selection states: subtle background highlight and pill‑shaped selection.

Right detail

Top: title + tags + small metadata line.

Middle: code editor area (slightly inset with rounded corners, almost like a “sheet” on the background).

Bottom / side: AI panel styled as a clean sheet with segmented controls/tabs for “Explain / Comments / Example”.

9.3 Micro‑interactions
Transitions

Smooth but minimal animations:

Fade/slide when switching snippets.

Soft scale / glow on primary buttons similar to Things’ “Magic Plus” when hovered/clicked.​

Feedback

Non‑intrusive toasts in bottom‑left or top‑right for:

Saved, deleted, export completed, AI error, etc.

Save feedback: tiny “Saved” label near the title or editor, disappearing after a second.

AI actions

When running an AI action:

Show a subtle inline progress indicator (“Thinking…” with animated dots) inside the AI panel.

Once complete, gently fade in the text.

9.4 Theming & Modes
Default theme




3.6 UI / UX implementation (Things 3 + massCode)
Requirements

3‑pane layout like massCode, with spacing, typography, and colors inspired by Things 3.​

Implementation tasks

Global theme

Define Tailwind (or CSS) theme:

Colors:

Light background.

Slightly tinted sidebar.

Primary blue accent.

Typography:

Base font (Inter/SF Pro).

Title, subtitle, meta styles.

Border radius + shadows (soft, rounded, subtle).​

Layout skeleton

Top-level layout:

Sidebar (fixed width left).

SnippetList (middle).

SnippetDetail (right, flex).

Responsive behavior:

Desktop-first; for smaller widths, allow sidebar collapse.