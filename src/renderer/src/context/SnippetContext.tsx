import * as React from 'react';
import type { Snippet, Tag, CreateSnippetPayload, UpdateSnippetPayload } from '@shared/types';

interface SnippetContextType {
  // State
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

  // Computed
  selectedSnippet: Snippet | null;
  filteredSnippets: Snippet[];

  // Actions
  setSelectedSnippetId: (id: string | null) => void;
  setSelectedSnippetIds: (ids: Set<string>) => void;
  setSelectedTagIds: (ids: string[]) => void;
  setSearchQuery: (query: string) => void;
  setShowFavoritesOnly: React.Dispatch<React.SetStateAction<boolean>>;
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
}

const SnippetContext = React.createContext<SnippetContextType | null>(null);

export function useSnippetContext() {
  const context = React.useContext(SnippetContext);
  if (!context) {
    throw new Error('useSnippetContext must be used within a SnippetProvider');
  }
  return context;
}

export function SnippetProvider({ children }: { children: React.ReactNode }) {
  const [snippets, setSnippets] = React.useState<Snippet[]>([]);
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [selectedSnippetId, setSelectedSnippetId] = React.useState<string | null>(null);
  const [selectedSnippetIds, setSelectedSnippetIds] = React.useState<Set<string>>(new Set());
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch snippets from API
  const fetchSnippets = React.useCallback(async () => {
    try {
      const result = await window.api.snippets.list();
      if (result.success && result.data) {
        setSnippets(result.data);
        // Select first snippet if none selected
        if (!selectedSnippetId && result.data.length > 0) {
          setSelectedSnippetId(result.data[0].id);
        }
      } else {
        setError(result.error || 'Failed to fetch snippets');
      }
    } catch (err) {
      setError(String(err));
    }
  }, [selectedSnippetId]);

  // Fetch tags from API
  const fetchTags = React.useCallback(async () => {
    try {
      const result = await window.api.tags.list();
      if (result.success && result.data) {
        setTags(result.data);
      } else {
        setError(result.error || 'Failed to fetch tags');
      }
    } catch (err) {
      setError(String(err));
    }
  }, []);

  // Refresh all data
  const refreshData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([fetchSnippets(), fetchTags()]);
    setIsLoading(false);
  }, [fetchSnippets, fetchTags]);

  // Initial data load
  React.useEffect(() => {
    refreshData();
  }, []);

  // Computed: selected snippet
  const selectedSnippet = React.useMemo(() => {
    return snippets.find(s => s.id === selectedSnippetId) ?? null;
  }, [snippets, selectedSnippetId]);

  // Computed: filtered snippets (client-side filtering for immediate feedback)
  const filteredSnippets = React.useMemo(() => {
    let result = snippets;

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter(s => s.isFavorite);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        s =>
          s.title.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query)
      );
    }

    // Filter by selected tags
    if (selectedTagIds.length > 0) {
      result = result.filter(s =>
        selectedTagIds.some(tagId => s.tags.some(t => t.id === tagId))
      );
    }

    return result;
  }, [snippets, searchQuery, selectedTagIds, showFavoritesOnly]);

  // Ensure selection stays in sync with favorites view
  React.useEffect(() => {
    if (!showFavoritesOnly) return;
    if (filteredSnippets.length === 0) {
      setSelectedSnippetId(null);
      return;
    }

    const selectedVisible = filteredSnippets.some(snippet => snippet.id === selectedSnippetId);
    if (!selectedVisible) {
      setSelectedSnippetId(filteredSnippets[0].id);
    }
  }, [filteredSnippets, selectedSnippetId, showFavoritesOnly]);

  // Actions
  const createSnippet = React.useCallback(async (payloadOverride?: Partial<CreateSnippetPayload>) => {
    setIsSaving(true);
    try {
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
        // Add to local state immediately
        setSnippets(prev => [result.data!, ...prev]);
        setSelectedSnippetId(result.data.id);
        // Refresh tags in case counts changed
        fetchTags();
        return result.data;
      } else {
        setError(result.error || 'Failed to create snippet');
        return null;
      }
    } catch (err) {
      setError(String(err));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [fetchTags, showFavoritesOnly]);

  const updateSnippet = React.useCallback(async (update: Partial<Snippet> & { id: string }) => {
    setIsSaving(true);
    try {
      const payload: UpdateSnippetPayload = {
        id: update.id,
        title: update.title,
        language: update.language,
        content: update.content,
        notes: update.notes ?? undefined,
        isFavorite: update.isFavorite,
        tags: update.tags?.map(t => t.name),
      };

      const result = await window.api.snippets.update(payload);

      if (result.success && result.data) {
        // Update local state immediately
        setSnippets(prev =>
          prev.map(s => s.id === update.id ? result.data! : s)
        );
        // Refresh tags in case counts changed (if tags were updated)
        if (update.tags !== undefined) {
          fetchTags();
        }
      } else {
        setError(result.error || 'Failed to update snippet');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  }, [fetchTags]);

  const deleteSnippet = React.useCallback(async (id: string) => {
    setIsSaving(true);
    try {
      const result = await window.api.snippets.delete(id);

      if (result.success) {
        // Remove from local state
        setSnippets(prev => prev.filter(s => s.id !== id));

        // Select another snippet if the deleted one was selected
        if (selectedSnippetId === id) {
          const remaining = snippets.filter(s => s.id !== id);
          setSelectedSnippetId(remaining[0]?.id ?? null);
        }

        // Refresh tags as counts may have changed
        fetchTags();
      } else {
        setError(result.error || 'Failed to delete snippet');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  }, [selectedSnippetId, snippets, fetchTags]);

  const toggleFavorite = React.useCallback(async (id: string) => {
    const target = snippets.find((snippet) => snippet.id === id);
    if (!target) return;

    await updateSnippet({ id, isFavorite: !target.isFavorite });
  }, [snippets, updateSnippet]);

  const toggleFavoriteMultiple = React.useCallback(async (ids: string[]) => {
    setIsSaving(true);
    try {
      // Determine if we should add or remove favorites (add if any are not favorites)
      const shouldAddFavorite = ids.some(id => {
        const snippet = snippets.find(s => s.id === id);
        return snippet && !snippet.isFavorite;
      });

      for (const id of ids) {
        const target = snippets.find(s => s.id === id);
        if (target && target.isFavorite !== shouldAddFavorite) {
          await window.api.snippets.update({ id, isFavorite: shouldAddFavorite });
        }
      }
      await fetchSnippets();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  }, [snippets, fetchSnippets]);

  const deleteMultipleSnippets = React.useCallback(async (ids: string[]) => {
    setIsSaving(true);
    try {
      for (const id of ids) {
        await window.api.snippets.delete(id);
      }
      // Remove from local state
      setSnippets(prev => prev.filter(s => !ids.includes(s.id)));
      // Clear multi-selection
      setSelectedSnippetIds(new Set());
      // Select another snippet if current was deleted
      if (selectedSnippetId && ids.includes(selectedSnippetId)) {
        const remaining = snippets.filter(s => !ids.includes(s.id));
        setSelectedSnippetId(remaining[0]?.id ?? null);
      }
      fetchTags();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  }, [selectedSnippetId, snippets, fetchTags]);

  // Tag CRUD operations
  const createTag = React.useCallback(async (name: string): Promise<Tag | null> => {
    setIsSaving(true);
    try {
      const result = await window.api.tags.create(name);
      if (result.success && result.data) {
        await fetchTags();
        return result.data;
      } else {
        setError(result.error || 'Failed to create tag');
        return null;
      }
    } catch (err) {
      setError(String(err));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [fetchTags]);

  const updateTag = React.useCallback(async (id: string, name: string): Promise<Tag | null> => {
    setIsSaving(true);
    try {
      const result = await window.api.tags.update(id, name);
      if (result.success && result.data) {
        await fetchTags();
        // Also refresh snippets to update tag names in snippet list
        await fetchSnippets();
        return result.data;
      } else {
        setError(result.error || 'Failed to update tag');
        return null;
      }
    } catch (err) {
      setError(String(err));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [fetchTags, fetchSnippets]);

  const deleteTag = React.useCallback(async (id: string): Promise<boolean> => {
    setIsSaving(true);
    try {
      const result = await window.api.tags.delete(id);
      if (result.success) {
        // Remove from selected tags if it was selected
        setSelectedTagIds(prev => prev.filter(tagId => tagId !== id));
        await fetchTags();
        // Refresh snippets to update tag lists
        await fetchSnippets();
        return true;
      } else {
        setError(result.error || 'Failed to delete tag');
        return false;
      }
    } catch (err) {
      setError(String(err));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [fetchTags, fetchSnippets]);

  const value: SnippetContextType = {
    snippets,
    tags,
    selectedSnippetId,
    selectedSnippetIds,
    selectedTagIds,
    searchQuery,
    showFavoritesOnly,
    isLoading,
    isSaving,
    error,
    selectedSnippet,
    filteredSnippets,
    setSelectedSnippetId,
    setSelectedSnippetIds,
    setSelectedTagIds,
    setSearchQuery,
    setShowFavoritesOnly,
    createSnippet,
    updateSnippet,
    toggleFavorite,
    toggleFavoriteMultiple,
    deleteSnippet,
    deleteMultipleSnippets,
    refreshData,
    createTag,
    updateTag,
    deleteTag,
  };

  return (
    <SnippetContext.Provider value={value}>
      {children}
    </SnippetContext.Provider>
  );
}
