import * as React from 'react';
import type { Snippet, Tag } from '@shared/types';

// Mock data for UI development - will be replaced with IPC calls
const MOCK_SNIPPETS: Snippet[] = [
  {
    id: '1',
    title: 'React useState Hook',
    language: 'typescript',
    content: `const [count, setCount] = useState(0);

// Increment the count
const handleClick = () => {
  setCount(prev => prev + 1);
};`,
    notes: 'Basic example of using the useState hook in React',
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-16T10:00:00Z',
    tags: [{ id: '1', name: 'react' }, { id: '2', name: 'hooks' }],
  },
  {
    id: '2',
    title: 'Python List Comprehension',
    language: 'python',
    content: `# Filter and transform in one line
squares = [x**2 for x in range(10) if x % 2 == 0]
print(squares)  # [0, 4, 16, 36, 64]`,
    notes: 'List comprehension with filtering',
    createdAt: '2024-12-14T08:00:00Z',
    updatedAt: '2024-12-14T08:00:00Z',
    tags: [{ id: '3', name: 'python' }],
  },
  {
    id: '3',
    title: 'Flexbox Centering',
    language: 'css',
    content: `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}`,
    notes: 'Perfect centering with flexbox',
    createdAt: '2024-12-13T15:00:00Z',
    updatedAt: '2024-12-13T15:00:00Z',
    tags: [{ id: '4', name: 'css' }, { id: '5', name: 'layout' }],
  },
];

const MOCK_TAGS: Tag[] = [
  { id: '1', name: 'react', count: 1 },
  { id: '2', name: 'hooks', count: 1 },
  { id: '3', name: 'python', count: 1 },
  { id: '4', name: 'css', count: 1 },
  { id: '5', name: 'layout', count: 1 },
];

interface SnippetContextType {
  // State
  snippets: Snippet[];
  tags: Tag[];
  selectedSnippetId: string | null;
  selectedTagIds: string[];
  searchQuery: string;
  isLoading: boolean;

  // Computed
  selectedSnippet: Snippet | null;
  filteredSnippets: Snippet[];

  // Actions
  setSelectedSnippetId: (id: string | null) => void;
  setSelectedTagIds: (ids: string[]) => void;
  setSearchQuery: (query: string) => void;
  createSnippet: () => void;
  updateSnippet: (snippet: Partial<Snippet> & { id: string }) => void;
  deleteSnippet: (id: string) => void;
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
  const [snippets, setSnippets] = React.useState<Snippet[]>(MOCK_SNIPPETS);
  const [tags] = React.useState<Tag[]>(MOCK_TAGS);
  const [selectedSnippetId, setSelectedSnippetId] = React.useState<string | null>(MOCK_SNIPPETS[0]?.id ?? null);
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading] = React.useState(false);

  // Computed: selected snippet
  const selectedSnippet = React.useMemo(() => {
    return snippets.find(s => s.id === selectedSnippetId) ?? null;
  }, [snippets, selectedSnippetId]);

  // Computed: filtered snippets
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
  const createSnippet = React.useCallback(() => {
    const newSnippet: Snippet = {
      id: crypto.randomUUID(),
      title: 'Untitled Snippet',
      language: 'plaintext',
      content: '',
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };
    setSnippets(prev => [newSnippet, ...prev]);
    setSelectedSnippetId(newSnippet.id);
  }, []);

  const updateSnippet = React.useCallback((update: Partial<Snippet> & { id: string }) => {
    setSnippets(prev =>
      prev.map(s =>
        s.id === update.id
          ? { ...s, ...update, updatedAt: new Date().toISOString() }
          : s
      )
    );
  }, []);

  const deleteSnippet = React.useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
    if (selectedSnippetId === id) {
      setSelectedSnippetId(snippets.find(s => s.id !== id)?.id ?? null);
    }
  }, [selectedSnippetId, snippets]);

  const value: SnippetContextType = {
    snippets,
    tags,
    selectedSnippetId,
    selectedTagIds,
    searchQuery,
    isLoading,
    selectedSnippet,
    filteredSnippets,
    setSelectedSnippetId,
    setSelectedTagIds,
    setSearchQuery,
    createSnippet,
    updateSnippet,
    deleteSnippet,
  };

  return (
    <SnippetContext.Provider value={value}>
      {children}
    </SnippetContext.Provider>
  );
}
