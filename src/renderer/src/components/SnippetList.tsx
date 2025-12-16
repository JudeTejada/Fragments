import { useSnippetContext } from '@/context/SnippetContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { Code2, Plus, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

interface SnippetRowProps {
  id: string;
  title: string;
  language: string;
  tags: { id: string; name: string }[];
  updatedAt: string;
  isSelected: boolean;
  onClick: () => void;
}

function SnippetRow({ title, language, tags, updatedAt, isSelected, onClick }: SnippetRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 rounded-xl transition-all',
        'hover:bg-accent/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'bg-accent shadow-sm'
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h3 className={cn(
          'font-medium text-sm truncate',
          isSelected ? 'text-foreground' : 'text-foreground/90'
        )}>
          {title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {language}
          </Badge>
          {tags.slice(0, 2).map(tag => (
            <span key={tag.id} className="text-muted-foreground/70">
              #{tag.name}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-muted-foreground/50">+{tags.length - 2}</span>
          )}
          <span className="ml-auto">{formatRelativeTime(updatedAt)}</span>
        </div>
      </div>
    </button>
  );
}

export function SnippetList() {
  const {
    filteredSnippets,
    selectedSnippetId,
    setSelectedSnippetId,
    searchQuery,
    createSnippet,
  } = useSnippetContext();

  const hasNoSnippets = filteredSnippets.length === 0;
  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="flex h-full w-80 flex-col border-r border-border bg-background/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-semibold text-sm text-foreground">
          {isSearchActive ? 'Search Results' : 'All Snippets'}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg"
          onClick={createSnippet}
        >
          <Plus className="size-4" />
          <span className="sr-only">New Snippet</span>
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {hasNoSnippets ? (
            <Empty className="border-none">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {isSearchActive ? <FileCode className="size-4" /> : <Code2 className="size-4" />}
                </EmptyMedia>
                <EmptyTitle>
                  {isSearchActive ? 'No results' : 'No snippets yet'}
                </EmptyTitle>
                <EmptyDescription>
                  {isSearchActive
                    ? 'Try a different search term'
                    : 'Create your first snippet to get started'}
                </EmptyDescription>
              </EmptyHeader>
              {!isSearchActive && (
                <EmptyContent>
                  <Button onClick={createSnippet} size="sm">
                    <Plus className="size-4 mr-1" />
                    Create Snippet
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            filteredSnippets.map(snippet => (
              <SnippetRow
                key={snippet.id}
                id={snippet.id}
                title={snippet.title}
                language={snippet.language}
                tags={snippet.tags}
                updatedAt={snippet.updatedAt}
                isSelected={snippet.id === selectedSnippetId}
                onClick={() => setSelectedSnippetId(snippet.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
