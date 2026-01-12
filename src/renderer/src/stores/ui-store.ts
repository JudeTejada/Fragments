import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import * as React from 'react'

interface UiState {
  selectedSnippetId: string | null
  selectedSnippetIds: Set<string>
  selectedTagIds: string[]
  searchQuery: string
  showFavoritesOnly: boolean
  showTrash: boolean
}

interface UiActions {
  setSelectedSnippetId: (id: string | null) => void
  setSelectedSnippetIds: (ids: Set<string>) => void
  setSelectedTagIds: (ids: string[]) => void
  setSearchQuery: (query: string) => void
  setShowFavoritesOnly: (value: React.SetStateAction<boolean>) => void
  setShowTrash: (show: boolean) => void
  clearFilters: () => void
}

type UiStore = UiState & UiActions

export const useUiStore = create<UiStore>()(
  devtools(
    (set) => ({
      selectedSnippetId: null,
      selectedSnippetIds: new Set(),
      selectedTagIds: [],
      searchQuery: '',
      showFavoritesOnly: false,
      showTrash: false,

      setSelectedSnippetId: (id) => set({ selectedSnippetId: id }),
      setSelectedSnippetIds: (ids) => set({ selectedSnippetIds: ids }),
      setSelectedTagIds: (ids) => set({ selectedTagIds: ids }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowFavoritesOnly: (value) =>
        set((state) => ({
          showFavoritesOnly: typeof value === 'function' ? value(state.showFavoritesOnly) : value
        })),
      setShowTrash: (show) => set({ showTrash: show }),
      clearFilters: () =>
        set({
          selectedTagIds: [],
          searchQuery: '',
          showFavoritesOnly: false,
          showTrash: false
        })
    }),
    { name: 'UiStore' }
  )
)

// Export the store instance for direct access (for cross-store communication)
export const uiStore = useUiStore
