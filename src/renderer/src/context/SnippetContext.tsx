import * as React from 'react'
import { create } from 'zustand'
import type {
  Snippet,
  Tag,
  CreateSnippetPayload,
  UpdateSnippetPayload,
  TrashedSnippet
} from '@shared/types'

type SnippetState = {
  snippets: Snippet[]
  tags: Tag[]
  selectedSnippetId: string | null
  selectedSnippetIds: Set<string>
  selectedTagIds: string[]
  searchQuery: string
  showFavoritesOnly: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  // Trash-related state
  trashItems: TrashedSnippet[]
  showTrash: boolean
}

type RefreshOptions = {
  silent?: boolean
}

type SnippetActions = {
  setSelectedSnippetId: (id: string | null) => void
  setSelectedSnippetIds: (ids: Set<string>) => void
  setSelectedTagIds: (ids: string[]) => void
  setSearchQuery: (query: string) => void
  setShowFavoritesOnly: (value: React.SetStateAction<boolean>) => void
  createSnippet: (payload?: Partial<CreateSnippetPayload>) => Promise<Snippet | null>
  updateSnippet: (update: Partial<Snippet> & { id: string }) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  toggleFavoriteMultiple: (ids: string[]) => Promise<void>
  deleteSnippet: (id: string) => Promise<void>
  deleteMultipleSnippets: (ids: string[]) => Promise<void>
  refreshData: (options?: RefreshOptions) => Promise<void>
  createTag: (name: string) => Promise<Tag | null>
  updateTag: (id: string, name: string) => Promise<Tag | null>
  deleteTag: (id: string) => Promise<boolean>
  reorderTags: (tagIds: string[]) => Promise<void>
  // Trash actions
  moveToTrash: (id: string) => Promise<void>
  restoreFromTrash: (id: string) => Promise<void>
  permanentDelete: (id: string) => Promise<void>
  emptyTrash: () => Promise<void>
  fetchTrashItems: () => Promise<void>
  setShowTrash: (show: boolean) => void
}

type SnippetStore = SnippetState & SnippetActions

const useSnippetStore = create<SnippetStore>((set, get) => {
  const snippetApi = window.api.snippets
  const tagApi = window.api.tags

  const getErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : String(err)

  const fetchSnippets = async () => {
    try {
      const result = await snippetApi.list()
      if (result.success && result.data) {
        set({ snippets: result.data })
        const { selectedSnippetId } = get()
        if (!selectedSnippetId && result.data.length > 0) {
          set({ selectedSnippetId: result.data[0].id })
        }
      } else {
        set({ error: result.error || 'Failed to fetch snippets' })
      }
    } catch (err) {
      set({ error: getErrorMessage(err) })
    }
  }

  const fetchTags = async () => {
    try {
      const result = await tagApi.list()
      if (result.success && result.data) {
        set({ tags: result.data })
      } else {
        set({ error: result.error || 'Failed to fetch tags' })
      }
    } catch (err) {
      set({ error: getErrorMessage(err) })
    }
  }

  return {
    snippets: [],
    tags: [],
    selectedSnippetId: null,
    selectedSnippetIds: new Set(),
    selectedTagIds: [],
    searchQuery: '',
    showFavoritesOnly: false,
    isLoading: true,
    isSaving: false,
    error: null,
    // Trash state
    trashItems: [],
    showTrash: false,
    setSelectedSnippetId: (id) => set({ selectedSnippetId: id }),
    setSelectedSnippetIds: (ids) => set({ selectedSnippetIds: ids }),
    setSelectedTagIds: (ids) => set({ selectedTagIds: ids }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setShowFavoritesOnly: (value) =>
      set((state) => ({
        showFavoritesOnly: typeof value === 'function' ? value(state.showFavoritesOnly) : value
      })),
    refreshData: async (options?: RefreshOptions) => {
      const silent = options?.silent ?? false
      if (!silent) {
        set({ isLoading: true, error: null })
      } else {
        set({ error: null })
      }

      await Promise.all([fetchSnippets(), fetchTags(), get().fetchTrashItems()])

      if (!silent) {
        set({ isLoading: false })
      }
    },
    createSnippet: async (payloadOverride?: Partial<CreateSnippetPayload>) => {
      set({ isSaving: true })
      try {
        const { showFavoritesOnly } = get()
        const payload: CreateSnippetPayload = {
          title: payloadOverride?.title?.trim() || 'Untitled Snippet',
          language: payloadOverride?.language ?? 'plaintext',
          content: payloadOverride?.content ?? '',
          notes: payloadOverride?.notes ?? '',
          isFavorite: payloadOverride?.isFavorite ?? showFavoritesOnly,
          tags: payloadOverride?.tags ?? []
        }

        const result = await snippetApi.create(payload)

        if (result.success && result.data) {
          const newSnippet = result.data as Snippet
          set((state) => ({ snippets: [newSnippet, ...state.snippets] }))
          set({ selectedSnippetId: newSnippet.id })
          fetchTags()
          return newSnippet
        }
        set({ error: result.error || 'Failed to create snippet' })
        return null
      } catch (err) {
        set({ error: getErrorMessage(err) })
        return null
      } finally {
        set({ isSaving: false })
      }
    },
    updateSnippet: async (update: Partial<Snippet> & { id: string }) => {
      set({ isSaving: true })
      try {
        const payload: UpdateSnippetPayload = {
          id: update.id,
          title: update.title,
          language: update.language,
          content: update.content,
          notes: update.notes ?? undefined,
          isFavorite: update.isFavorite,
          tags: update.tags?.map((tag) => tag.name)
        }

        const result = await snippetApi.update(payload)

        if (result.success && result.data) {
          const updatedSnippet = result.data as Snippet
          set((state) => ({
            snippets: state.snippets.map((snippet) =>
              snippet.id === update.id ? updatedSnippet : snippet
            )
          }))
          if (update.tags !== undefined) {
            fetchTags()
          }
        } else {
          set({ error: result.error || 'Failed to update snippet' })
        }
      } catch (err) {
        set({ error: getErrorMessage(err) })
      } finally {
        set({ isSaving: false })
      }
    },
    toggleFavorite: async (id: string) => {
      const { snippets, updateSnippet } = get()
      const target = snippets.find((snippet) => snippet.id === id)
      if (!target) return

      await updateSnippet({ id, isFavorite: !target.isFavorite })
    },
    toggleFavoriteMultiple: async (ids: string[]) => {
      set({ isSaving: true })
      try {
        const { snippets } = get()
        const shouldAddFavorite = ids.some((id) => {
          const snippet = snippets.find((item) => item.id === id)
          return snippet && !snippet.isFavorite
        })

        for (const id of ids) {
          const target = snippets.find((item) => item.id === id)
          if (target && target.isFavorite !== shouldAddFavorite) {
            await snippetApi.update({ id, isFavorite: shouldAddFavorite })
          }
        }
        await fetchSnippets()
      } catch (err) {
        set({ error: getErrorMessage(err) })
      } finally {
        set({ isSaving: false })
      }
    },
    deleteSnippet: async (id: string) => {
      set({ isSaving: true })
      try {
        const { selectedSnippetId, snippets } = get()
        const result = await snippetApi.softDelete(id)

        if (result.success) {
          set((state) => ({ snippets: state.snippets.filter((snippet) => snippet.id !== id) }))

          if (selectedSnippetId === id) {
            const remaining = snippets.filter((snippet) => snippet.id !== id)
            set({ selectedSnippetId: remaining[0]?.id ?? null })
          }

          fetchTags()
          // Refresh trash items to show the deleted item
          await get().fetchTrashItems()
        } else {
          set({ error: result.error || 'Failed to delete snippet' })
        }
      } catch (err) {
        set({ error: getErrorMessage(err) })
      } finally {
        set({ isSaving: false })
      }
    },
    deleteMultipleSnippets: async (ids: string[]) => {
      set({ isSaving: true })
      try {
        const { selectedSnippetId, snippets } = get()
        for (const id of ids) {
          await snippetApi.softDelete(id)
        }
        set((state) => ({
          snippets: state.snippets.filter((snippet) => !ids.includes(snippet.id))
        }))
        set({ selectedSnippetIds: new Set() })
        if (selectedSnippetId && ids.includes(selectedSnippetId)) {
          const remaining = snippets.filter((snippet) => !ids.includes(snippet.id))
          set({ selectedSnippetId: remaining[0]?.id ?? null })
        }
        fetchTags()
        // Refresh trash items to show the deleted items
        await get().fetchTrashItems()
      } catch (err) {
        set({ error: getErrorMessage(err) })
      } finally {
        set({ isSaving: false })
      }
    },
    createTag: async (name: string): Promise<Tag | null> => {
      set({ isSaving: true })
      try {
        const result = await tagApi.create(name)
        if (result.success && result.data) {
          await fetchTags()
          return result.data
        }
        set({ error: result.error || 'Failed to create tag' })
        return null
      } catch (err) {
        set({ error: getErrorMessage(err) })
        return null
      } finally {
        set({ isSaving: false })
      }
    },
    updateTag: async (id: string, name: string): Promise<Tag | null> => {
      set({ isSaving: true })
      try {
        const result = await tagApi.update(id, name)
        if (result.success && result.data) {
          await fetchTags()
          await fetchSnippets()
          return result.data
        }
        set({ error: result.error || 'Failed to update tag' })
        return null
      } catch (err) {
        set({ error: getErrorMessage(err) })
        return null
      } finally {
        set({ isSaving: false })
      }
    },
    deleteTag: async (id: string): Promise<boolean> => {
      set({ isSaving: true })
      try {
        const result = await tagApi.delete(id)
        if (result.success) {
          set((state) => ({
            selectedTagIds: state.selectedTagIds.filter((tagId) => tagId !== id)
          }))
          await fetchTags()
          await fetchSnippets()
          return true
        }
        set({ error: result.error || 'Failed to delete tag' })
        return false
      } catch (err) {
        set({ error: getErrorMessage(err) })
        return false
      } finally {
        set({ isSaving: false })
      }
    },
    reorderTags: async (tagIds: string[]): Promise<void> => {
      set({ isSaving: true })
      try {
        const result = await tagApi.reorder(tagIds)
        if (result.success) {
          // Optimistically update local state
          const { tags } = get()
          const reorderedTags = tagIds
            .map((id) => tags.find((t) => t.id === id))
            .filter((t): t is Tag => t !== undefined)
          set({ tags: reorderedTags })
        } else {
          set({ error: result.error || 'Failed to reorder tags' })
        }
      } catch (err) {
        set({ error: getErrorMessage(err) })
      } finally {
        set({ isSaving: false })
      }
    },

    // Trash actions
    moveToTrash: async (id: string) => {
      set({ isSaving: true })
      try {
        const result = await snippetApi.softDelete(id)
        if (result.success) {
          // Remove from main snippets list
          set((state) => ({ snippets: state.snippets.filter((snippet) => snippet.id !== id) }))
          // Refresh trash items
          await get().fetchTrashItems()
        } else {
          set({ error: result.error || 'Failed to move snippet to trash' })
        }
      } catch (err) {
        set({ error: getErrorMessage(err) })
      } finally {
        set({ isSaving: false })
      }
    },

    restoreFromTrash: async (id: string) => {
      set({ isSaving: true })
      try {
        const result = await snippetApi.restore(id)
        if (result.success) {
          // Refresh both snippets and trash
          await Promise.all([fetchSnippets(), get().fetchTrashItems()])
        } else {
          set({ error: result.error || 'Failed to restore snippet from trash' })
        }
      } catch (err) {
        set({ error: getErrorMessage(err) })
      } finally {
        set({ isSaving: false })
      }
    },

    permanentDelete: async (id: string) => {
      set({ isSaving: true })
      try {
        const result = await snippetApi.permanentDelete(id)
        if (result.success) {
          // Remove from trash items
          set((state) => ({ trashItems: state.trashItems.filter((item) => item.id !== id) }))
          // Clean up orphaned tags
          fetchTags()
        } else {
          set({ error: result.error || 'Failed to permanently delete snippet' })
        }
      } catch (err) {
        set({ error: getErrorMessage(err) })
      } finally {
        set({ isSaving: false })
      }
    },

    emptyTrash: async () => {
      set({ isSaving: true })
      try {
        const result = await snippetApi.emptyTrash()
        if (result.success) {
          set({ trashItems: [] })
          // Clean up orphaned tags
          fetchTags()
        } else {
          set({ error: result.error || 'Failed to empty trash' })
        }
      } catch (err) {
        set({ error: getErrorMessage(err) })
      } finally {
        set({ isSaving: false })
      }
    },

    fetchTrashItems: async () => {
      try {
        const result = await snippetApi.getTrash()
        if (result.success && result.data) {
          set({ trashItems: result.data })
        } else {
          set({ error: result.error || 'Failed to fetch trash items' })
        }
      } catch (err) {
        set({ error: getErrorMessage(err) })
      }
    },

    setShowTrash: (show: boolean) => set({ showTrash: show })
  }
})

export function useSnippetState<T>(selector: (state: SnippetState) => T) {
  return useSnippetStore(selector as (state: SnippetStore) => T)
}

export function useSnippetActions<T>(selector: (actions: SnippetActions) => T) {
  return useSnippetStore(selector as (state: SnippetStore) => T)
}

export function useFilteredSnippets() {
  const snippets = useSnippetState((state) => state.snippets)
  const searchQuery = useSnippetState((state) => state.searchQuery)
  const selectedTagIds = useSnippetState((state) => state.selectedTagIds)
  const showFavoritesOnly = useSnippetState((state) => state.showFavoritesOnly)

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

export function useSelectedSnippet() {
  const snippets = useSnippetState((state) => state.snippets)
  const selectedSnippetId = useSnippetState((state) => state.selectedSnippetId)

  return React.useMemo(
    () => snippets.find((snippet) => snippet.id === selectedSnippetId) ?? null,
    [snippets, selectedSnippetId]
  )
}

export function SnippetProvider({ children }: { children: React.ReactNode }) {
  const refreshData = useSnippetActions((actions) => actions.refreshData)
  const setSelectedSnippetId = useSnippetActions((actions) => actions.setSelectedSnippetId)
  const selectedSnippetId = useSnippetState((state) => state.selectedSnippetId)
  const showFavoritesOnly = useSnippetState((state) => state.showFavoritesOnly)
  const filteredSnippets = useFilteredSnippets()

  React.useEffect(() => {
    refreshData()
  }, [refreshData])

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
