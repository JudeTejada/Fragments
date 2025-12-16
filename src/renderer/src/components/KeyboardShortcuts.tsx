import * as React from 'react';
import { useSnippetContext } from '@/context/SnippetContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * Global keyboard shortcuts provider
 * Wraps children and listens for keyboard shortcuts
 */
export function KeyboardShortcutsProvider({
  children,
  searchInputRef
}: KeyboardShortcutsProviderProps) {
  const { createSnippet } = useSnippetContext();

  const shortcuts = React.useMemo(() => [
    {
      key: 'n',
      metaKey: true,
      action: () => {
        createSnippet();
      },
      description: 'Create new snippet',
    },
    {
      key: 'f',
      metaKey: true,
      action: () => {
        searchInputRef?.current?.focus();
      },
      description: 'Focus search',
    },
  ], [createSnippet, searchInputRef]);

  useKeyboardShortcuts(shortcuts);

  return <>{children}</>;
}

/**
 * Keyboard shortcut hint component
 */
export function KeyboardShortcutHint({
  keys,
  className
}: {
  keys: string[];
  className?: string;
}) {
  return (
    <span className={className}>
      {keys.map((key, i) => (
        <React.Fragment key={key}>
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-muted border rounded">
            {key}
          </kbd>
          {i < keys.length - 1 && <span className="mx-0.5">+</span>}
        </React.Fragment>
      ))}
    </span>
  );
}
