import * as React from 'react';
import type { Snippet, Tag, CreateSnippetPayload, UpdateSnippetPayload } from '@shared/types';

interface SnippetContextType {
  // State
  snippets: Snippet[];
  tags: Tag[];
  selectedSnippetId: string | null;
  selectedTagIds: string[];
  searchQuery: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Computed
  selectedSnippet: Snippet | null;
  filteredSnippets: Snippet[];

  // Actions
  setSelectedSnippetId: (id: string | null) => void;
  setSelectedTagIds: (ids: string[]) => void;
  setSearchQuery: (query: string) => void;
  createSnippet: () => Promise<void>;
  updateSnippet: (update: Partial<Snippet> & { id: string }) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
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
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
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
  }, [snippets, searchQuery, selectedTagIds]);

  // Actions
  const createSnippet = React.useCallback(async () => {
    setIsSaving(true);
    try {
      const payload: CreateSnippetPayload = {
        title: 'Untitled Snippet',
        language: 'plaintext',
        content: '',
        notes: '',
        tags: [],
      };

      const result = await window.api.snippets.create(payload);

      if (result.success && result.data) {
        // Add to local state immediately
        setSnippets(prev => [result.data!, ...prev]);
        setSelectedSnippetId(result.data.id);
        // Refresh tags in case counts changed
        fetchTags();
      } else {
        setError(result.error || 'Failed to create snippet');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  }, [fetchTags]);

  const updateSnippet = React.useCallback(async (update: Partial<Snippet> & { id: string }) => {
    setIsSaving(true);
    try {
      const payload: UpdateSnippetPayload = {
        id: update.id,
        title: update.title,
        language: update.language,
        content: update.content,
        notes: update.notes ?? undefined,
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

  const value: SnippetContextType = {
    snippets,
    tags,
    selectedSnippetId,
    selectedTagIds,
    searchQuery,
    isLoading,
    isSaving,
    error,
    selectedSnippet,
    filteredSnippets,
    setSelectedSnippetId,
    setSelectedTagIds,
    setSearchQuery,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    refreshData,
  };

  return (
    <SnippetContext.Provider value={value}>
      {children}
    </SnippetContext.Provider>
  );
}

