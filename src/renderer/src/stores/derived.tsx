import * as React from 'react'
import { useSnippetStore } from './snippet-store'
import { useTagStore } from './tag-store'
import { useTrashStore } from './trash-store'
import { useUiStore } from './ui-store'

// Derived hook: filter snippets based on search, tags, and favorites
export function useFilteredSnippets() {
  const snippets = useSnippetStore((state) => state.snippets)
  const searchQuery = useUiStore((state) => state.searchQuery)
  const selectedTagIds = useUiStore((state) => state.selectedTagIds)
  const showFavoritesOnly = useUiStore((state) => state.showFavoritesOnly)

  return React.useMemo(() => {
    let result = snippets

    if (showFavoritesOnly) {
      result = result.filter((snippet) => snippet.isFavorite)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (snippet) =>
          snippet.title.toLowerCase().includes(query) ||
          snippet.content.toLowerCase().includes(query)
      )
    }

    if (selectedTagIds.length > 0) {
      result = result.filter((snippet) =>
        selectedTagIds.some((tagId) => snippet.tags.some((tag) => tag.id === tagId))
      )
    }

    return result
  }, [snippets, searchQuery, selectedTagIds, showFavoritesOnly])
}

// Derived hook: get the currently selected snippet
export function useSelectedSnippet() {
  const snippets = useSnippetStore((state) => state.snippets)
  const selectedSnippetId = useUiStore((state) => state.selectedSnippetId)

  return React.useMemo(
    () => snippets.find((snippet) => snippet.id === selectedSnippetId) ?? null,
    [snippets, selectedSnippetId]
  )
}

// Provider: initializes data on mount and handles auto-selection
export function SnippetProvider({ children }: { children: React.ReactNode }) {
  const refreshSnippets = useSnippetStore((state) => state.refreshSnippets)
  const refreshTags = useTagStore((state) => state.refreshTags)
  const fetchTrashItems = useTrashStore((state) => state.fetchTrashItems)
  const setSelectedSnippetId = useUiStore((state) => state.setSelectedSnippetId)
  const selectedSnippetId = useUiStore((state) => state.selectedSnippetId)
  const showFavoritesOnly = useUiStore((state) => state.showFavoritesOnly)
  const filteredSnippets = useFilteredSnippets()

  // Initial data load
  React.useEffect(() => {
    const refreshAll = async () => {
      await Promise.all([
        refreshSnippets(),
        refreshTags(),
        fetchTrashItems()
      ])
    }
    refreshAll()
  }, [refreshSnippets, refreshTags, fetchTrashItems])

  // Auto-select first snippet when favorites filter changes
  React.useEffect(() => {
    if (!showFavoritesOnly) return
    if (filteredSnippets.length === 0) {
      setSelectedSnippetId(null)
      return
    }

    const selectedVisible = filteredSnippets.some((snippet) => snippet.id === selectedSnippetId)
    if (!selectedVisible) {
      setSelectedSnippetId(filteredSnippets[0].id)
    }
  }, [filteredSnippets, selectedSnippetId, showFavoritesOnly, setSelectedSnippetId])

  return <>{children}</>
}
