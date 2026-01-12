import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { snippetStore } from './snippet-store'
import { getErrorMessage } from './shared/utils'

const snippetApi = window.api.snippets

interface FavoritesState {
  favoriteSnippetIds: Set<string>
  isSaving: boolean
  error: string | null
}

interface FavoritesActions {
  toggleFavorite: (id: string) => Promise<void>
  toggleFavoriteMultiple: (ids: string[]) => Promise<void>
  isFavorite: (id: string) => boolean
}

type FavoritesStore = FavoritesState & FavoritesActions

export const useFavoritesStore = create<FavoritesStore>()(
  devtools(
    (set, get) => ({
      favoriteSnippetIds: new Set(),
      isSaving: false,
      error: null,

      toggleFavorite: async (id: string) => {
        const snippets = snippetStore.getState().snippets
        const target = snippets.find((snippet) => snippet.id === id)
        if (!target) return

        set({ isSaving: true, error: null })
        try {
          const result = await snippetApi.update({ id, isFavorite: !target.isFavorite })

          if (result.success && result.data) {
            const updatedSnippet = result.data
            // Update favorites state
            set((state) => {
              const newFavorites = new Set(state.favoriteSnippetIds)
              if (updatedSnippet.isFavorite) {
                newFavorites.add(id)
              } else {
                newFavorites.delete(id)
              }
              return { favoriteSnippetIds: newFavorites }
            })
            // Refresh snippet store
            await snippetStore.getState().refreshSnippets({ silent: true })
          } else {
            set({ error: result.error || 'Failed to toggle favorite' })
          }
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          set({ isSaving: false })
        }
      },

      toggleFavoriteMultiple: async (ids: string[]) => {
        set({ isSaving: true, error: null })
        try {
          const snippets = snippetStore.getState().snippets
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

          // Update favorites state
          set((state) => {
            const newFavorites = new Set(state.favoriteSnippetIds)
            for (const id of ids) {
              if (shouldAddFavorite) {
                newFavorites.add(id)
              } else {
                newFavorites.delete(id)
              }
            }
            return { favoriteSnippetIds: newFavorites }
          })

          // Refresh snippet store
          await snippetStore.getState().refreshSnippets({ silent: true })
        } catch (err) {
          set({ error: getErrorMessage(err) })
        } finally {
          set({ isSaving: false })
        }
      },

      isFavorite: (id: string) => {
        return get().favoriteSnippetIds.has(id)
      }
    }),
    { name: 'FavoritesStore' }
  )
)

// Export the store instance for direct access (for cross-store communication)
export const favoritesStore = useFavoritesStore
