import { useFilteredSnippets, useSnippetActions, useSnippetState } from '@/context/SnippetContext'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
} from '@/components/ui/empty'
import { ContextMenu, useContextMenu } from '@/components/ui/context-menu'
import { useMultiSelect } from '@/hooks/useMultiSelect'
import { Code2, Plus, FileCode, Loader2, Star, Trash2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useHotkeys } from 'react-hotkeys-hook'
import * as React from 'react'

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

interface SnippetRowProps {
  title: string
  language: string
  tags: { id: string; name: string }[]
  updatedAt: string
  isFavorite: boolean
  isSelected: boolean
  isMultiSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

function SnippetRow({
  title,
  language,
  tags,
  updatedAt,
  isFavorite,
  isSelected,
  isMultiSelected,
  onClick,
  onContextMenu
}: SnippetRowProps) {
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      data-testid="snippet-row"
      data-title={title}
      className={cn(
        'w-full text-left px-4 py-3 rounded-xl transition-all',
        'hover:bg-accent/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'bg-accent shadow-sm',
        isMultiSelected && !isSelected && 'bg-accent/70 ring-1 ring-primary/30'
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              'font-medium text-sm truncate',
              isSelected || isMultiSelected ? 'text-foreground' : 'text-foreground/90'
            )}
          >
            {title}
          </h3>
          {isFavorite && <Star className="size-4 text-amber-500 fill-amber-400" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {language}
          </Badge>
          {tags.slice(0, 2).map((tag) => (
            <span key={tag.id} className="text-muted-foreground/70">
              #{tag.name}
            </span>
          ))}
          {tags.length > 2 && <span className="text-muted-foreground/50">+{tags.length - 2}</span>}
          <span className="ml-auto">{formatRelativeTime(updatedAt)}</span>
        </div>
      </div>
    </button>
  )
}

function SnippetRowSkeleton() {
  return (
    <div className="w-full px-4 py-3">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12 ml-auto" />
        </div>
      </div>
    </div>
  )
}

export function SnippetList() {
  const filteredSnippets = useFilteredSnippets()
  const selectedSnippetId = useSnippetState((state) => state.selectedSnippetId)
  const searchQuery = useSnippetState((state) => state.searchQuery)
  const showFavoritesOnly = useSnippetState((state) => state.showFavoritesOnly)
  const isLoading = useSnippetState((state) => state.isLoading)
  const isSaving = useSnippetState((state) => state.isSaving)
  const setSelectedSnippetId = useSnippetActions((actions) => actions.setSelectedSnippetId)
  const createSnippet = useSnippetActions((actions) => actions.createSnippet)
  const deleteSnippet = useSnippetActions((actions) => actions.deleteSnippet)
  const deleteMultipleSnippets = useSnippetActions((actions) => actions.deleteMultipleSnippets)
  const toggleFavoriteMultiple = useSnippetActions((actions) => actions.toggleFavoriteMultiple)
  const [isCreating, setIsCreating] = React.useState(false)

  // Multi-select hook
  const {
    selectedIds: multiSelectedIds,
    isMultiSelectMode,
    handleClick: handleMultiSelectClick,
    clearSelection,
    isSelected: isMultiSelected
  } = useMultiSelect({
    items: filteredSnippets,
    getItemId: (s) => s.id
  })

  // Context menu hook
  const contextMenu = useContextMenu()

  const hasNoSnippets = filteredSnippets.length === 0 && !isLoading
  const isSearchActive = searchQuery.trim().length > 0
  const headerTitle = isSearchActive
    ? showFavoritesOnly
      ? 'Search Favorites'
      : 'Search Results'
    : showFavoritesOnly
      ? 'Favorites'
      : 'All Snippets'

  const handleCreateSnippet = React.useCallback(async () => {
    if (isCreating || isSaving) return
    setIsCreating(true)
    try {
      await createSnippet()
    } finally {
      setIsCreating(false)
    }
  }, [createSnippet, isCreating, isSaving])

  // Get the effective selection for context menu actions
  const getEffectiveSelection = React.useCallback((): string[] => {
    if (multiSelectedIds.size > 0) {
      return Array.from(multiSelectedIds)
    }
    if (contextMenu.targetId) {
      return [contextMenu.targetId]
    }
    if (selectedSnippetId) {
      return [selectedSnippetId]
    }
    return []
  }, [multiSelectedIds, contextMenu.targetId, selectedSnippetId])

  // Handle snippet click - UX: only change detail view on normal click, not during multi-select
  const handleSnippetClick = React.useCallback(
    (snippetId: string, index: number, e: React.MouseEvent) => {
      handleMultiSelectClick(snippetId, index, e)

      // Only update the detail view selection on normal (non-shift) clicks
      if (!e.shiftKey) {
        setSelectedSnippetId(snippetId)
      }
      // When shift+clicking, keep the detail view on the previously selected snippet
    },
    [handleMultiSelectClick, setSelectedSnippetId]
  )

  // Handle right-click context menu
  const handleContextMenu = React.useCallback(
    (snippetId: string, e: React.MouseEvent) => {
      // If right-clicking on an unselected snippet and no multi-selection
      if (!isMultiSelected(snippetId) && multiSelectedIds.size === 0) {
        // Select this snippet for detail view
        setSelectedSnippetId(snippetId)
      }

      contextMenu.open(e, snippetId)
    },
    [isMultiSelected, multiSelectedIds.size, setSelectedSnippetId, contextMenu]
  )

  // Context menu actions
  const handleDelete = React.useCallback(async () => {
    const ids = getEffectiveSelection()
    if (ids.length === 0) return

    if (ids.length === 1) {
      await deleteSnippet(ids[0])
    } else {
      await deleteMultipleSnippets(ids)
    }
    clearSelection()
  }, [getEffectiveSelection, deleteSnippet, deleteMultipleSnippets, clearSelection])

  const handleAddToFavorites = React.useCallback(async () => {
    const ids = getEffectiveSelection()
    if (ids.length === 0) return

    await toggleFavoriteMultiple(ids)
    clearSelection()
  }, [getEffectiveSelection, toggleFavoriteMultiple, clearSelection])

  const contextMenuItems = React.useMemo(
    () => [
      {
        label: 'Add to Favourites',
        icon: <Heart className="size-4" />,
        onClick: handleAddToFavorites,
        testId: 'context-menu-favorites',
        shortcut: '⌘F',
        shortcutKey: 'f'
      },
      {
        label: 'Move to Trash',
        icon: <Trash2 className="size-4" />,
        onClick: handleDelete,
        variant: 'destructive' as const,
        testId: 'context-menu-delete',
        shortcut: '⌫',
        shortcutKey: 'Backspace'
      }
    ],
    [handleAddToFavorites, handleDelete]
  )

  // Handle keyboard shortcuts
  useHotkeys(
    'delete, backspace',
    (event) => {
      event.preventDefault()
      if (multiSelectedIds.size > 0 && !isSaving) {
        deleteMultipleSnippets(Array.from(multiSelectedIds))
        clearSelection()
      } else if (selectedSnippetId && !isSaving && filteredSnippets.length > 0) {
        deleteSnippet(selectedSnippetId)
      }
    },
    {
      enableOnFormTags: false,
      description: 'Delete selected snippet(s)'
    },
    [
      selectedSnippetId,
      multiSelectedIds,
      deleteSnippet,
      deleteMultipleSnippets,
      isSaving,
      filteredSnippets.length,
      clearSelection
    ]
  )

  // Clear multi-selection when pressing Escape
  useHotkeys(
    'escape',
    () => {
      clearSelection()
      contextMenu.close()
    },
    { enableOnFormTags: false },
    [clearSelection, contextMenu]
  )

  return (
    <div className="flex h-full w-80 flex-col border-r border-border bg-background/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-foreground">{headerTitle}</h2>
          {showFavoritesOnly && <Star className="size-4 text-amber-500 fill-amber-400" />}
          {isMultiSelectMode && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {multiSelectedIds.size} selected
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg"
          onClick={handleCreateSnippet}
          disabled={isCreating || isSaving}
        >
          {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          <span className="sr-only">New Snippet</span>
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            // Loading skeletons
            <>
              <SnippetRowSkeleton />
              <SnippetRowSkeleton />
              <SnippetRowSkeleton />
            </>
          ) : hasNoSnippets ? (
            <Empty className="border-none">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {isSearchActive ? <FileCode className="size-4" /> : <Code2 className="size-4" />}
                </EmptyMedia>
                <EmptyTitle>
                  {isSearchActive
                    ? showFavoritesOnly
                      ? 'No favorite matches'
                      : 'No results'
                    : showFavoritesOnly
                      ? 'No favorites yet'
                      : 'No snippets yet'}
                </EmptyTitle>
                <EmptyDescription>
                  {isSearchActive
                    ? 'Try a different search term'
                    : showFavoritesOnly
                      ? 'Mark snippets as favorites to see them here'
                      : 'Create your first snippet to get started'}
                </EmptyDescription>
              </EmptyHeader>
              {!isSearchActive && (
                <EmptyContent>
                  <Button
                    onClick={handleCreateSnippet}
                    size="sm"
                    disabled={isCreating || isSaving}
                  >
                    <Plus className="size-4 mr-1" />
                    Create Snippet
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            filteredSnippets.map((snippet, index) => (
              <SnippetRow
                key={snippet.id}
                title={snippet.title}
                language={snippet.language}
                tags={snippet.tags}
                updatedAt={snippet.updatedAt}
                isFavorite={snippet.isFavorite}
                isSelected={snippet.id === selectedSnippetId}
                isMultiSelected={isMultiSelected(snippet.id)}
                onClick={(e) => handleSnippetClick(snippet.id, index, e)}
                onContextMenu={(e) => handleContextMenu(snippet.id, e)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Context Menu */}
      <ContextMenu
        open={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={contextMenu.close}
        items={contextMenuItems}
        separator={[0]}
      />
    </div>
  )
}
