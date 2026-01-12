import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Snippet, CreateSnippetPayload, UpdateSnippetPayload, Tag } from '@shared/types'
import { getErrorMessage } from './shared/utils'
import { uiStore } from './ui-store'

// Lazy import to avoid circular dependency with trash-store
async function refreshTrashItems() {
  try {
    const { trashStore } = await import('./trash-store')
    await trashStore.getState().fetchTrashItems()
  } catch (err) {
    console.error('Failed to refresh trash items', err)
  }
}

const snippetApi = window.api.snippets

interface SnippetState {
  snippets: Snippet[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

interface SnippetActions {
  createSnippet: (payload?: Partial<CreateSnippetPayload>) => Promise<Snippet | null>
  updateSnippet: (update: Partial<Snippet> & { id: string }) => Promise<void>
  deleteSnippet: (id: string) => Promise<void>
  deleteMultipleSnippets: (ids: string[]) => Promise<void>
  refreshSnippets: (options?: { silent?: boolean }) => Promise<void>
  getSnippetById: (id: string) => Snippet | null
}

type SnippetStore = SnippetState & SnippetActions

export const useSnippetStore = create<SnippetStore>()(
  devtools(
    (set, get) => ({
      snippets: [],
      isLoading: false,
      isSaving: false,
      error: null,

      createSnippet: async (payloadOverride?: Partial<CreateSnippetPayload>) => {
        set({ isSaving: true, error: null })
        try {
          const payload: CreateSnippetPayload = {
            title: payloadOverride?.title?.trim() || 'Untitled Snippet',
            language: payloadOverride?.language ?? 'plaintext',
            content: payloadOverride?.content ?? '',
            notes: payloadOverride?.notes ?? '',
            isFavorite: payloadOverride?.isFavorite ?? false,
            tags: payloadOverride?.tags ?? []
          }

          const result = await snippetApi.create(payload)

          if (result.success && result.data) {
            const newSnippet = result.data as Snippet
            set((state) => ({ snippets: [newSnippet, ...state.snippets] }))
            // Ensure the freshly created snippet is shown in the detail view
            uiStore.getState().setShowTrash(false)
            uiStore.getState().setSelectedSnippetId(newSnippet.id)
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
        set({ isSaving: true, error: null })
        try {
          const payload: UpdateSnippetPayload = {
            id: update.id,
            title: update.title,
            language: update.language,
            content: update.content,
            notes: update.notes ?? undefined,
            isFavorite: update.isFavorite,
            tags: update.tags?.map((tag: Tag) => tag.name)
          }

          const result = await snippetApi.update(payload)

          if (result.success && result.data) {
            const updatedSnippet = result.data as Snippet
            set((state) => ({
              snippets: state.snippets.map((snippet) =>
                snippet.id === update.id ? updatedSnippet : snippet
              )
            }))
          } else {
            set({ error: result.error || 'Failed to update snippet' })
          }
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          set({ isSaving: false })
        }
      },

      deleteSnippet: async (id: string) => {
        set({ isSaving: true, error: null })
        try {
          const result = await snippetApi.softDelete(id)

          if (result.success) {
            set((state) => ({ snippets: state.snippets.filter((snippet) => snippet.id !== id) }))
            // Keep trash sidebar count in sync
            await refreshTrashItems()
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
        set({ isSaving: true, error: null })
        try {
          for (const id of ids) {
            await snippetApi.softDelete(id)
          }
          set((state) => ({
            snippets: state.snippets.filter((snippet) => !ids.includes(snippet.id))
          }))
          await refreshTrashItems()
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          set({ isSaving: false })
        }
      },

      refreshSnippets: async (options?: { silent?: boolean }) => {
        const silent = options?.silent ?? false
        if (!silent) {
          set({ isLoading: true, error: null })
        } else {
          set({ error: null })
        }
        try {
          const result = await snippetApi.list()
          if (result.success && result.data) {
            set({ snippets: result.data })
          } else {
            set({ error: result.error || 'Failed to fetch snippets' })
          }
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          if (!silent) {
            set({ isLoading: false })
          }
        }
      },

      getSnippetById: (id: string) => {
        const { snippets } = get()
        return snippets.find((snippet) => snippet.id === id) ?? null
      }
    }),
    { name: 'SnippetStore' }
  )
)

// Export the store instance for direct access (for cross-store communication)
export const snippetStore = useSnippetStore
