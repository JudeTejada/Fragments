import * as React from 'react';
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import type { Snippet, Tag, CreateSnippetPayload, UpdateSnippetPayload } from '@shared/types';

type SnippetState = {
  snippets: Snippet[];
  tags: Tag[];
  selectedSnippetId: string | null;
  selectedSnippetIds: Set<string>;
  selectedTagIds: string[];
  searchQuery: string;
  showFavoritesOnly: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
};

type SnippetActions = {
  setSelectedSnippetId: (id: string | null) => void;
  setSelectedSnippetIds: (ids: Set<string>) => void;
  setSelectedTagIds: (ids: string[]) => void;
  setSearchQuery: (query: string) => void;
  setShowFavoritesOnly: (value: boolean | ((prev: boolean) => boolean)) => void;
  createSnippet: (payload?: Partial<CreateSnippetPayload>) => Promise<Snippet | null>;
  updateSnippet: (update: Partial<Snippet> & { id: string }) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleFavoriteMultiple: (ids: string[]) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  deleteMultipleSnippets: (ids: string[]) => Promise<void>;
  refreshData: () => Promise<void>;
  // Tag actions
  createTag: (name: string) => Promise<Tag | null>;
  updateTag: (id: string, name: string) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<boolean>;
};

type SnippetStore = SnippetState & SnippetActions;

const useSnippetStore = create<SnippetStore>((set, get) => {
  const fetchSnippets = async () => {
    try {
      const result = await window.api.snippets.list();
      if (result.success && result.data) {
        set((state) => ({
          snippets: result.data,
          selectedSnippetId: state.selectedSnippetId ?? result.data[0]?.id ?? null,
        }));
      } else {
        set({ error: result.error || 'Failed to fetch snippets' });
      }
    } catch (err) {
      set({ error: String(err) });
    }
  };

  const fetchTags = async () => {
    try {
      const result = await window.api.tags.list();
      if (result.success && result.data) {
        set({ tags: result.data });
      } else {
        set({ error: result.error || 'Failed to fetch tags' });
      }
    } catch (err) {
      set({ error: String(err) });
    }
  };

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
    setSelectedSnippetId: (id) => set({ selectedSnippetId: id }),
    setSelectedSnippetIds: (ids) => set({ selectedSnippetIds: new Set(ids) }),
    setSelectedTagIds: (ids) => set({ selectedTagIds: [...ids] }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setShowFavoritesOnly: (value) =>
      set((state) => ({
        showFavoritesOnly: typeof value === 'function' ? value(state.showFavoritesOnly) : value,
      })),
    refreshData: async () => {
      set({ isLoading: true, error: null });
      await Promise.all([fetchSnippets(), fetchTags()]);
      set({ isLoading: false });
    },
    createSnippet: async (payloadOverride) => {
      set({ isSaving: true });
      try {
        const payload: CreateSnippetPayload = {
          title: payloadOverride?.title?.trim() || 'Untitled Snippet',
          language: payloadOverride?.language ?? 'plaintext',
          content: payloadOverride?.content ?? '',
          notes: payloadOverride?.notes ?? '',
          isFavorite: payloadOverride?.isFavorite ?? get().showFavoritesOnly,
          tags: payloadOverride?.tags ?? [],
        };

        const result = await window.api.snippets.create(payload);

        if (result.success && result.data) {
          set((state) => ({
            snippets: [result.data!, ...state.snippets],
            selectedSnippetId: result.data!.id,
          }));
          fetchTags();
          return result.data;
        }

        set({ error: result.error || 'Failed to create snippet' });
        return null;
      } catch (err) {
        set({ error: String(err) });
        return null;
      } finally {
        set({ isSaving: false });
      }
    },
    updateSnippet: async (update) => {
      set({ isSaving: true });
      try {
        const payload: UpdateSnippetPayload = {
          id: update.id,
          title: update.title,
          language: update.language,
          content: update.content,
          notes: update.notes ?? undefined,
          isFavorite: update.isFavorite,
          tags: update.tags?.map((tag) => tag.name),
        };

        const result = await window.api.snippets.update(payload);

        if (result.success && result.data) {
          set((state) => ({
            snippets: state.snippets.map((snippet) =>
              snippet.id === update.id ? result.data! : snippet
            ),
          }));
          if (update.tags !== undefined) {
            fetchTags();
          }
        } else {
          set({ error: result.error || 'Failed to update snippet' });
        }
      } catch (err) {
        set({ error: String(err) });
      } finally {
        set({ isSaving: false });
      }
    },
    toggleFavorite: async (id) => {
      const target = get().snippets.find((snippet) => snippet.id === id);
      if (!target) return;

      await get().updateSnippet({ id, isFavorite: !target.isFavorite });
    },
    toggleFavoriteMultiple: async (ids) => {
      set({ isSaving: true });
      try {
        const snippets = get().snippets;
        const shouldAddFavorite = ids.some((id) => {
          const snippet = snippets.find((item) => item.id === id);
          return snippet && !snippet.isFavorite;
        });

        for (const id of ids) {
          const target = snippets.find((snippet) => snippet.id === id);
          if (target && target.isFavorite !== shouldAddFavorite) {
            await window.api.snippets.update({ id, isFavorite: shouldAddFavorite });
          }
        }

        await fetchSnippets();
      } catch (err) {
        set({ error: String(err) });
      } finally {
        set({ isSaving: false });
      }
    },
    deleteSnippet: async (id) => {
      set({ isSaving: true });
      try {
        const result = await window.api.snippets.delete(id);

        if (result.success) {
          set((state) => {
            const remaining = state.snippets.filter((snippet) => snippet.id !== id);
            return {
              snippets: remaining,
              selectedSnippetId:
                state.selectedSnippetId === id ? remaining[0]?.id ?? null : state.selectedSnippetId,
            };
          });
          fetchTags();
        } else {
          set({ error: result.error || 'Failed to delete snippet' });
        }
      } catch (err) {
        set({ error: String(err) });
      } finally {
        set({ isSaving: false });
      }
    },
    deleteMultipleSnippets: async (ids) => {
      set({ isSaving: true });
      try {
        for (const id of ids) {
          await window.api.snippets.delete(id);
        }

        set((state) => {
          const remaining = state.snippets.filter((snippet) => !ids.includes(snippet.id));
          return {
            snippets: remaining,
            selectedSnippetIds: new Set(),
            selectedSnippetId:
              state.selectedSnippetId && ids.includes(state.selectedSnippetId)
                ? remaining[0]?.id ?? null
                : state.selectedSnippetId,
          };
        });
        fetchTags();
      } catch (err) {
        set({ error: String(err) });
      } finally {
        set({ isSaving: false });
      }
    },
    createTag: async (name) => {
      set({ isSaving: true });
      try {
        const result = await window.api.tags.create(name);
        if (result.success && result.data) {
          await fetchTags();
          return result.data;
        }
        set({ error: result.error || 'Failed to create tag' });
        return null;
      } catch (err) {
        set({ error: String(err) });
        return null;
      } finally {
        set({ isSaving: false });
      }
    },
    updateTag: async (id, name) => {
      set({ isSaving: true });
      try {
        const result = await window.api.tags.update(id, name);
        if (result.success && result.data) {
          await fetchTags();
          await fetchSnippets();
          return result.data;
        }
        set({ error: result.error || 'Failed to update tag' });
        return null;
      } catch (err) {
        set({ error: String(err) });
        return null;
      } finally {
        set({ isSaving: false });
      }
    },
    deleteTag: async (id) => {
      set({ isSaving: true });
      try {
        const result = await window.api.tags.delete(id);
        if (result.success) {
          set((state) => ({
            selectedTagIds: state.selectedTagIds.filter((tagId) => tagId !== id),
          }));
          await fetchTags();
          await fetchSnippets();
          return true;
        }
        set({ error: result.error || 'Failed to delete tag' });
        return false;
      } catch (err) {
        set({ error: String(err) });
        return false;
      } finally {
        set({ isSaving: false });
      }
    },
  };
});

export const useSnippetValues = <T,>(
  selector: (state: SnippetState) => T,
  equalityFn?: (a: T, b: T) => boolean
) => useSnippetStore((state) => selector(state), equalityFn);

export const useSnippetActions = <T,>(
  selector: (state: SnippetActions) => T,
  equalityFn?: (a: T, b: T) => boolean
) => useSnippetStore((state) => selector(state), equalityFn);

export function useSelectedSnippet() {
  const { snippets, selectedSnippetId } = useSnippetValues(
    (state) => ({
      snippets: state.snippets,
      selectedSnippetId: state.selectedSnippetId,
    }),
    shallow
  );

  return React.useMemo(
    () => snippets.find((snippet) => snippet.id === selectedSnippetId) ?? null,
    [snippets, selectedSnippetId]
  );
}

export function useFilteredSnippets() {
  const { snippets, searchQuery, selectedTagIds, showFavoritesOnly } = useSnippetValues(
    (state) => ({
      snippets: state.snippets,
      searchQuery: state.searchQuery,
      selectedTagIds: state.selectedTagIds,
      showFavoritesOnly: state.showFavoritesOnly,
    }),
    shallow
  );

  return React.useMemo(() => {
    let result = snippets;

    if (showFavoritesOnly) {
      result = result.filter((snippet) => snippet.isFavorite);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (snippet) =>
          snippet.title.toLowerCase().includes(query) ||
          snippet.content.toLowerCase().includes(query)
      );
    }

    if (selectedTagIds.length > 0) {
      result = result.filter((snippet) =>
        selectedTagIds.some((tagId) => snippet.tags.some((tag) => tag.id === tagId))
      );
    }

    return result;
  }, [snippets, searchQuery, selectedTagIds, showFavoritesOnly]);
}

export function SnippetProvider({ children }: { children: React.ReactNode }) {
  const refreshData = useSnippetActions((state) => state.refreshData);
  const setSelectedSnippetId = useSnippetActions((state) => state.setSelectedSnippetId);
  const showFavoritesOnly = useSnippetValues((state) => state.showFavoritesOnly);
  const selectedSnippetId = useSnippetValues((state) => state.selectedSnippetId);
  const filteredSnippets = useFilteredSnippets();

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  React.useEffect(() => {
    if (!showFavoritesOnly) return;
    if (filteredSnippets.length === 0) {
      if (selectedSnippetId !== null) {
        setSelectedSnippetId(null);
      }
      return;
    }

    const selectedVisible = filteredSnippets.some((snippet) => snippet.id === selectedSnippetId);
    if (!selectedVisible) {
      setSelectedSnippetId(filteredSnippets[0].id);
    }
  }, [filteredSnippets, selectedSnippetId, showFavoritesOnly, setSelectedSnippetId]);

  return <>{children}</>;
}
