import { useHotkeys } from 'react-hotkeys-hook'
import * as React from 'react'

/**
 * Simple hook for registering keyboard shortcuts using react-hotkeys-hook
 * Use this instead of the old manual event handling approach
 */
export function useKeyboardShortcut(
  keys: string,
  callback: (event: KeyboardEvent) => void,
  options?: Parameters<typeof useHotkeys>[2]
) {
  const callbackRef = React.useRef(callback)
  callbackRef.current = callback

  useHotkeys(
    keys,
    (event) => {
      event.preventDefault()
      callbackRef.current(event)
    },
    {
      description: 'Keyboard shortcut',
      enableOnFormTags: true,
      enableOnContentEditable: true,
      ...options
    },
    []
  )
}

/**
 * Hook for focusing an element on a keyboard shortcut
 */
export function useFocusShortcut(
  ref: React.RefObject<HTMLElement>,
  keys: string,
  options?: Parameters<typeof useHotkeys>[2]
) {
  useKeyboardShortcut(
    keys,
    () => ref.current?.focus(),
    {
      description: 'Focus element',
      enableOnFormTags: true,
      ...options
    }
  )
}
