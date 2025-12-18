import * as React from 'react'

interface UseMultiSelectOptions<T> {
  items: T[]
  getItemId: (item: T) => string
  onSelectionChange?: (selectedIds: Set<string>) => void
}

interface UseMultiSelectReturn {
  selectedIds: Set<string>
  lastClickedIndex: number | null
  isMultiSelectMode: boolean
  handleClick: (itemId: string, index: number, e: React.MouseEvent) => void
  clearSelection: () => void
  selectAll: () => void
  isSelected: (itemId: string) => boolean
}

/**
 * A reusable hook for multi-selection behavior similar to file explorers.
 *
 * Features:
 * - Shift+click for range selection
 * - Normal click to clear selection and focus single item
 * - Track multi-select mode separately from single selection
 *
 * @example
 * ```tsx
 * const { selectedIds, handleClick, isMultiSelectMode } = useMultiSelect({
 *   items: snippets,
 *   getItemId: (s) => s.id,
 * })
 * ```
 */
export function useMultiSelect<T>({
  items,
  getItemId,
  onSelectionChange,
}: UseMultiSelectOptions<T>): UseMultiSelectReturn {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [lastClickedIndex, setLastClickedIndex] = React.useState<number | null>(null)

  const isMultiSelectMode = selectedIds.size > 1

  const handleClick = React.useCallback(
    (_itemId: string, index: number, e: React.MouseEvent) => {
      if (e.shiftKey && lastClickedIndex !== null) {
        // Shift+click: select range
        const start = Math.min(lastClickedIndex, index)
        const end = Math.max(lastClickedIndex, index)
        const rangeIds = items.slice(start, end + 1).map(getItemId)
        const newSelection = new Set(rangeIds)
        setSelectedIds(newSelection)
        onSelectionChange?.(newSelection)
      } else {
        // Normal click: clear multi-selection, track index for future shift+click
        setSelectedIds(new Set())
        setLastClickedIndex(index)
        onSelectionChange?.(new Set())
      }
    },
    [items, getItemId, lastClickedIndex, onSelectionChange]
  )

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set())
    setLastClickedIndex(null)
    onSelectionChange?.(new Set())
  }, [onSelectionChange])

  const selectAll = React.useCallback(() => {
    const allIds = new Set(items.map(getItemId))
    setSelectedIds(allIds)
    onSelectionChange?.(allIds)
  }, [items, getItemId, onSelectionChange])

  const isSelected = React.useCallback(
    (itemId: string) => selectedIds.has(itemId),
    [selectedIds]
  )

  return {
    selectedIds,
    lastClickedIndex,
    isMultiSelectMode,
    handleClick,
    clearSelection,
    selectAll,
    isSelected,
  }
}
