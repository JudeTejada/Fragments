---
name: base-ui-expert
description: Base-UI component library for React. Use for: (1) unstyled accessible primitives, (2) keyboard navigation and focus management, (3) component slots and parts pattern, (4) tailwind integration, (5) state props (open, onOpenChange), (6) coss UI migration, (7) custom styling with data attributes.
---

# Base-UI Expert

## Component Structure

Base-UI provides unstyled, accessible primitives with a clear parts pattern:

```tsx
import * as Popover from '@base-ui-components/react/popover'

<Popover.Root open={open} onOpenChange={setOpen}>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Positioner>
    <Popover.Popper>
      <Popover.Title>Title</Popover.Title>
      <Popover.Description>Description</Popover.Description>
      <Popover.Close>Close</Popover.Close>
    </Popover.Popper>
  </Popover.Positioner>
</Popover.Root>
```

## Tailwind Styling Pattern

```tsx<Popover.Popper className="data-[expanding]:w-full data-[expanding]:bg-white ...">
```

## Key Props Pattern

Most components follow this API:

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | State callback |
| `defaultOpen` | `boolean` | Uncontrolled initial state |
| `disabled` | `boolean` | Disable interaction |
| `required` | `boolean` | Form validation |

## Common Components

- `Popup` - Floating UI base
- `Menu` - Dropdown menus
- `Popover` - Tooltips/panels
- `Dialog` - Modals
- `Accordion` - Collapsible sections
- `Select` - Custom selects
- `Slider` - Range inputs
- `Switch` - Toggle switches

## Accessibility Built-in

- ARIA attributes auto-managed
- Focus trap in dialogs
- Keyboard navigation (Arrow keys, Enter, Escape)
- Screen reader announcements
