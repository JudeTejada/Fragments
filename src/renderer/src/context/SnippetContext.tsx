import * as React from 'react';
import { create } from 'zustand';
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
  setShowFavoritesOnly: (value: React.SetStateAction<boolean>) => void;
  createSnippet: (payload?: Partial<CreateSnippetPayload>) => Promise<Snippet | null>;
  updateSnippet: (update: Partial<Snippet> & { id: string }) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleFavoriteMultiple: (ids: string[]) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  deleteMultipleSnippets: (ids: string[]) => Promise<void>;
  refreshData: () => Promise<void>;
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
        set({ snippets: result.data });
        const { selectedSnippetId } = get();
        if (!selectedSnippetId && result.data.length > 0) {
          set({ selectedSnippetId: result.data[0].id });
        }
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
    setSelectedSnippetIds: (ids) => set({ selectedSnippetIds: ids }),
    setSelectedTagIds: (ids) => set({ selectedTagIds: ids }),
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
    createSnippet: async (payloadOverride?: Partial<CreateSnippetPayload>) => {
      set({ isSaving: true });
      try {
        const { showFavoritesOnly } = get();
        const payload: CreateSnippetPayload = {
          title: payloadOverride?.title?.trim() || 'Untitled Snippet',
          language: payloadOverride?.language ?? 'plaintext',
          content: payloadOverride?.content ?? '',
          notes: payloadOverride?.notes ?? '',
          isFavorite: payloadOverride?.isFavorite ?? showFavoritesOnly,
          tags: payloadOverride?.tags ?? [],
        };

        const result = await window.api.snippets.create(payload);

        if (result.success && result.data) {
          set((state) => ({ snippets: [result.data!, ...state.snippets] }));
          set({ selectedSnippetId: result.data.id });
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
    updateSnippet: async (update: Partial<Snippet> & { id: string }) => {
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
    toggleFavorite: async (id: string) => {
      const { snippets, updateSnippet } = get();
      const target = snippets.find((snippet) => snippet.id === id);
      if (!target) return;

      await updateSnippet({ id, isFavorite: !target.isFavorite });
    },
    toggleFavoriteMultiple: async (ids: string[]) => {
      set({ isSaving: true });
      try {
        const { snippets } = get();
        const shouldAddFavorite = ids.some((id) => {
          const snippet = snippets.find((item) => item.id === id);
          return snippet && !snippet.isFavorite;
        });

        for (const id of ids) {
          const target = snippets.find((item) => item.id === id);
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
    deleteSnippet: async (id: string) => {
      set({ isSaving: true });
      try {
        const { selectedSnippetId, snippets } = get();
        const result = await window.api.snippets.delete(id);

        if (result.success) {
          set((state) => ({ snippets: state.snippets.filter((snippet) => snippet.id !== id) }));

          if (selectedSnippetId === id) {
            const remaining = snippets.filter((snippet) => snippet.id !== id);
            set({ selectedSnippetId: remaining[0]?.id ?? null });
          }

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
    deleteMultipleSnippets: async (ids: string[]) => {
      set({ isSaving: true });
      try {
        const { selectedSnippetId, snippets } = get();
        for (const id of ids) {
          await window.api.snippets.delete(id);
        }
        set((state) => ({
          snippets: state.snippets.filter((snippet) => !ids.includes(snippet.id)),
        }));
        set({ selectedSnippetIds: new Set() });
        if (selectedSnippetId && ids.includes(selectedSnippetId)) {
          const remaining = snippets.filter((snippet) => !ids.includes(snippet.id));
          set({ selectedSnippetId: remaining[0]?.id ?? null });
        }
        fetchTags();
      } catch (err) {
        set({ error: String(err) });
      } finally {
        set({ isSaving: false });
      }
    },
    createTag: async (name: string): Promise<Tag | null> => {
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
    updateTag: async (id: string, name: string): Promise<Tag | null> => {
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
    deleteTag: async (id: string): Promise<boolean> => {
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

export function useSnippetState<T>(
  selector: (state: SnippetState) => T
) {
  return useSnippetStore(selector as (state: SnippetStore) => T);
}

export function useSnippetActions<T>(
  selector: (actions: SnippetActions) => T
) {
  return useSnippetStore(selector as (state: SnippetStore) => T);
}

export function useFilteredSnippets() {
  const snippets = useSnippetState((state) => state.snippets);
  const searchQuery = useSnippetState((state) => state.searchQuery);
  const selectedTagIds = useSnippetState((state) => state.selectedTagIds);
  const showFavoritesOnly = useSnippetState((state) => state.showFavoritesOnly);

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

export function useSelectedSnippet() {
  const snippets = useSnippetState((state) => state.snippets);
  const selectedSnippetId = useSnippetState((state) => state.selectedSnippetId);

  return React.useMemo(
    () => snippets.find((snippet) => snippet.id === selectedSnippetId) ?? null,
    [snippets, selectedSnippetId]
  );
}

export function SnippetProvider({ children }: { children: React.ReactNode }) {
  const refreshData = useSnippetActions((actions) => actions.refreshData);
  const setSelectedSnippetId = useSnippetActions((actions) => actions.setSelectedSnippetId);
  const selectedSnippetId = useSnippetState((state) => state.selectedSnippetId);
  const showFavoritesOnly = useSnippetState((state) => state.showFavoritesOnly);
  const filteredSnippets = useFilteredSnippets();

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  React.useEffect(() => {
    if (!showFavoritesOnly) return;
    if (filteredSnippets.length === 0) {
      setSelectedSnippetId(null);
      return;
    }

    const selectedVisible = filteredSnippets.some((snippet) => snippet.id === selectedSnippetId);
    if (!selectedVisible) {
      setSelectedSnippetId(filteredSnippets[0].id);
    }
  }, [filteredSnippets, selectedSnippetId, showFavoritesOnly, setSelectedSnippetId]);

  return <>{children}</>;
}
