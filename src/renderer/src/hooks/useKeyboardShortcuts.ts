import * as React from 'react';

interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

/**
 * Hook for registering global keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
          // Allow Cmd+N and Cmd+F even in editable fields
          if (shortcut.metaKey && ['n', 'f'].includes(shortcut.key.toLowerCase())) {
            event.preventDefault();
            shortcut.action();
            return;
          }

          // For other shortcuts, don't trigger in editable fields
          if (!isEditable) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Hook for focusing an element on a keyboard shortcut
 */
export function useFocusShortcut(
  ref: React.RefObject<HTMLElement>,
  key: string,
  metaKey = true
) {
  useKeyboardShortcuts([{
    key,
    metaKey,
    action: () => ref.current?.focus(),
    description: `Focus element`,
  }]);
}
