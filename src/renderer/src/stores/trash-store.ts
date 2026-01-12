import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { TrashedSnippet } from '@shared/types'
import { snippetStore } from './snippet-store'
import { tagStore } from './tag-store'
import { getErrorMessage } from './shared/utils'

const snippetApi = window.api.snippets

interface TrashState {
  trashItems: TrashedSnippet[]
  isLoading: boolean
  isDeleting: boolean
  error: string | null
}

interface TrashActions {
  fetchTrashItems: () => Promise<void>
  restoreFromTrash: (id: string) => Promise<void>
  permanentDelete: (id: string) => Promise<void>
  emptyTrash: () => Promise<void>
  moveToTrash: (id: string) => Promise<void>
}

type TrashStore = TrashState & TrashActions

export const useTrashStore = create<TrashStore>()(
  devtools(
    (set, get) => ({
      trashItems: [],
      isLoading: false,
      isDeleting: false,
      error: null,

      fetchTrashItems: async () => {
        set({ isLoading: true, error: null })
        try {
          const result = await snippetApi.getTrash()
          if (result.success && result.data) {
            set({ trashItems: result.data })
          } else {
            set({ error: result.error || 'Failed to fetch trash items' })
          }
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          set({ isLoading: false })
        }
      },

      restoreFromTrash: async (id: string) => {
        set({ isDeleting: true, error: null })
        try {
          const result = await snippetApi.restore(id)
          if (result.success) {
            // Refresh both snippets and trash
            await Promise.all([
              snippetStore.getState().refreshSnippets({ silent: true }),
              get().fetchTrashItems()
            ])
          } else {
            set({ error: result.error || 'Failed to restore snippet from trash' })
          }
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          set({ isDeleting: false })
        }
      },

      permanentDelete: async (id: string) => {
        set({ isDeleting: true, error: null })
        try {
          const result = await snippetApi.permanentDelete(id)
          if (result.success) {
            // Remove from trash items
            set((state) => ({ trashItems: state.trashItems.filter((item) => item.id !== id) }))
            // Clean up orphaned tags
            await tagStore.getState().refreshTags({ silent: true })
          } else {
            set({ error: result.error || 'Failed to permanently delete snippet' })
          }
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          set({ isDeleting: false })
        }
      },

      emptyTrash: async () => {
        set({ isDeleting: true, error: null })
        try {
          const result = await snippetApi.emptyTrash()
          if (result.success) {
            set({ trashItems: [] })
            // Clean up orphaned tags
            await tagStore.getState().refreshTags({ silent: true })
          } else {
            set({ error: result.error || 'Failed to empty trash' })
          }
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          set({ isDeleting: false })
        }
      },

      moveToTrash: async (id: string) => {
        set({ isDeleting: true, error: null })
        try {
          const result = await snippetApi.softDelete(id)
          if (result.success) {
            // Refresh trash items
            await get().fetchTrashItems()
          } else {
            set({ error: result.error || 'Failed to move snippet to trash' })
          }
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          set({ isDeleting: false })
        }
      }
    }),
    { name: 'TrashStore' }
  )
)

// Export the store instance for direct access (for cross-store communication)
export const trashStore = useTrashStore
