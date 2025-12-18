import * as React from 'react'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/ui/kbd'

interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive'
  testId?: string
  shortcut?: string // e.g., '⌘D' or '⌫'
  shortcutKey?: string // The actual key to listen for, e.g., 'd' or 'Backspace'
}

interface ContextMenuProps {
  open: boolean
  position: { x: number; y: number }
  onClose: () => void
  items: ContextMenuItem[]
  separator?: number[] // Indices after which to add a separator
}

/**
 * A reusable context menu component that can be positioned at any x,y coordinates.
 *
 * Features:
 * - Fixed positioning at mouse coordinates
 * - Keyboard support (Escape to close, shortcuts for items)
 * - Click outside to close
 * - Support for icons, destructive variants, separators, and keyboard shortcuts
 *
 * @example
 * ```tsx
 * <ContextMenu
 *   open={isOpen}
 *   position={{ x: 100, y: 200 }}
 *   onClose={() => setIsOpen(false)}
 *   items={[
 *     { label: 'Edit', icon: <Edit />, onClick: handleEdit, shortcut: '⌘E', shortcutKey: 'e' },
 *     { label: 'Delete', icon: <Trash />, onClick: handleDelete, variant: 'destructive', shortcut: '⌫', shortcutKey: 'Backspace' },
 *   ]}
 *   separator={[0]}
 * />
 * ```
 */
export function ContextMenu({ open, position, onClose, items, separator = [] }: ContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Handle keyboard shortcuts and closing
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Check for shortcut matches
      for (const item of items) {
        if (item.shortcutKey && e.key.toLowerCase() === item.shortcutKey.toLowerCase()) {
          e.preventDefault()
          item.onClick()
          onClose()
          return
        }
      }
    }

    // Small delay to prevent immediate close on right-click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 10)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, items])

  // Adjust position to keep menu within viewport
  const adjustedPosition = React.useMemo(() => {
    if (!open) return position

    const menuWidth = 200 // Approximate width
    const menuHeight = items.length * 36 + separator.length * 9 // Approximate height

    let x = position.x
    let y = position.y

    if (typeof window !== 'undefined') {
      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 8
      }
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 8
      }
    }

    return { x: Math.max(8, x), y: Math.max(8, y) }
  }, [open, position, items.length, separator.length])

  if (!open) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 rounded-lg border bg-popover shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
      role="menu"
      aria-orientation="vertical"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          <button
            role="menuitem"
            className={cn(
              'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
              item.variant === 'destructive'
                ? 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10'
                : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
            )}
            onClick={() => {
              item.onClick()
              onClose()
            }}
            data-testid={item.testId}
          >
            {item.icon && <span className="size-4">{item.icon}</span>}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <Kbd className="ml-auto text-xs opacity-60">{item.shortcut}</Kbd>
            )}
          </button>
          {separator.includes(index) && (
            <div className="mx-2 my-1 h-px bg-border" role="separator" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

/**
 * Hook to manage context menu state and positioning.
 *
 * @example
 * ```tsx
 * const { isOpen, position, open, close, targetId } = useContextMenu()
 *
 * // In your component:
 * onContextMenu={(e) => open(e, item.id)}
 * ```
 */
export function useContextMenu() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [targetId, setTargetId] = React.useState<string | null>(null)

  const open = React.useCallback((e: React.MouseEvent, id?: string) => {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
    setTargetId(id ?? null)
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  return { isOpen, position, targetId, open, close }
}
