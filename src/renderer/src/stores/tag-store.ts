import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Tag } from '@shared/types'
import { getErrorMessage } from './shared/utils'

const tagApi = window.api.tags

interface TagState {
  tags: Tag[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

interface TagActions {
  createTag: (name: string) => Promise<Tag | null>
  updateTag: (id: string, name: string) => Promise<Tag | null>
  deleteTag: (id: string) => Promise<boolean>
  reorderTags: (tagIds: string[]) => Promise<void>
  refreshTags: (options?: { silent?: boolean }) => Promise<void>
  getTagById: (id: string) => Tag | null
}

type TagStore = TagState & TagActions

export const useTagStore = create<TagStore>()(
  devtools(
    (set, get) => ({
      tags: [],
      isLoading: false,
      isSaving: false,
      error: null,

      createTag: async (name: string): Promise<Tag | null> => {
        set({ isSaving: true, error: null })
        try {
          const result = await tagApi.create(name)
          if (result.success && result.data) {
            await get().refreshTags()
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
        set({ isSaving: true, error: null })
        try {
          const result = await tagApi.update(id, name)
          if (result.success && result.data) {
            await get().refreshTags()
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
        set({ isSaving: true, error: null })
        try {
          const result = await tagApi.delete(id)
          if (result.success) {
            await get().refreshTags()
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
        set({ isSaving: true, error: null })
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

      refreshTags: async (options?: { silent?: boolean }) => {
        const silent = options?.silent ?? false
        if (!silent) {
          set({ isLoading: true, error: null })
        } else {
          set({ error: null })
        }
        try {
          const result = await tagApi.list()
          if (result.success && result.data) {
            set({ tags: result.data })
          } else {
            set({ error: result.error || 'Failed to fetch tags' })
          }
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          if (!silent) {
            set({ isLoading: false })
          }
        }
      },

      getTagById: (id: string) => {
        const { tags } = get()
        return tags.find((tag) => tag.id === id) ?? null
      }
    }),
    { name: 'TagStore' }
  )
)

// Export the store instance for direct access (for cross-store communication)
export const tagStore = useTagStore
