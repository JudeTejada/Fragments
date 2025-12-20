import * as React from 'react'
import Fuse from 'fuse.js'
import { useSnippetState, useSnippetActions } from '@/context/SnippetContext'
import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { FileCode, Clock, Search } from 'lucide-react'
import type { Snippet } from '@shared/types'

const RECENT_SNIPPETS_KEY = 'quick-switcher-recent'
const MAX_RECENT = 10
const MAX_RESULTS = 10

interface QuickSwitcherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Helper to get recent snippet IDs from localStorage
function getRecentSnippetIds(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SNIPPETS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper to add a snippet to recent list
function addToRecent(snippetId: string): void {
  const recent = getRecentSnippetIds().filter((id) => id !== snippetId)
  recent.unshift(snippetId)
  localStorage.setItem(RECENT_SNIPPETS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

interface SnippetItemData {
  id: string
  title: string
  language: string
  tags: { id: string; name: string }[]
}

type SearchableSnippet = Snippet & { fragmentsText: string }

export function QuickSwitcher({ open, onOpenChange }: QuickSwitcherProps) {
  const snippets = useSnippetState((state) => state.snippets)
  const setSelectedSnippetId = useSnippetActions((actions) => actions.setSelectedSnippetId)
  const [query, setQuery] = React.useState('')

  const searchableSnippets = React.useMemo<SearchableSnippet[]>(() => {
    return snippets.map((snippet) => ({
      ...snippet,
      fragmentsText: snippet.fragments.map((fragment) => fragment.content).join(' ')
    }))
  }, [snippets])

  // Create Fuse instance for fuzzy search
  const fuse = React.useMemo(() => {
    return new Fuse(searchableSnippets, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'content', weight: 1 },
        { name: 'fragmentsText', weight: 1 },
        { name: 'tags.name', weight: 1.5 },
        { name: 'notes', weight: 0.5 }
      ],
      threshold: 0.4,
      includeMatches: true,
      ignoreLocation: true
    })
  }, [searchableSnippets])

  // Get recent snippets
  const recentSnippets = React.useMemo((): SnippetItemData[] => {
    const recentIds = getRecentSnippetIds()
    return recentIds
      .map((id) => snippets.find((s) => s.id === id))
      .filter((s): s is Snippet => s !== undefined)
      .slice(0, MAX_RECENT)
      .map((s) => ({ id: s.id, title: s.title, language: s.language, tags: s.tags }))
  }, [snippets])

  // Search results
  const searchResults = React.useMemo((): SnippetItemData[] => {
    if (!query.trim()) return []
    return fuse
      .search(query)
      .slice(0, MAX_RESULTS)
      .map((r) => ({
        id: r.item.id,
        title: r.item.title,
        language: r.item.language,
        tags: r.item.tags
      }))
  }, [fuse, query])

  // Handle selecting a snippet
  const handleSelect = React.useCallback(
    (snippetId: string) => {
      addToRecent(snippetId)
      setSelectedSnippetId(snippetId)
      onOpenChange(false)
      setQuery('')
    },
    [setSelectedSnippetId, onOpenChange]
  )

  const handleDialogKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
      }
    },
    [onOpenChange]
  )

  // Reset query when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  const hasQuery = query.trim().length > 0
  const hasNoResults = hasQuery && searchResults.length === 0
  const hasNoRecent = !hasQuery && recentSnippets.length === 0
  const displayItems = hasQuery ? searchResults : recentSnippets
  const groupLabel = hasQuery ? 'Results' : 'Recent'

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandDialogPopup onKeyDownCapture={handleDialogKeyDown}>
        <Command>
          <CommandInput
            placeholder="Search snippets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <CommandPanel>
            <CommandEmpty>
              {hasNoResults && (
                <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                  <Search className="size-10 opacity-50" />
                  <p className="text-sm">No snippets found</p>
                  <p className="text-xs opacity-70">Try a different search term</p>
                </div>
              )}
              {hasNoRecent && (
                <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                  <Clock className="size-10 opacity-50" />
                  <p className="text-sm">No recent snippets</p>
                  <p className="text-xs opacity-70">Your recently accessed snippets will appear here</p>
                </div>
              )}
            </CommandEmpty>
            {displayItems.length > 0 && (
              <CommandList>
                <CommandGroup>
                  <CommandGroupLabel>
                    <span className="flex items-center gap-1.5">
                      {hasQuery ? (
                        <Search className="size-3.5" />
                      ) : (
                        <Clock className="size-3.5" />
                      )}
                      {groupLabel}
                    </span>
                  </CommandGroupLabel>
                  {displayItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onClick={() => handleSelect(item.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <FileCode className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {item.title || 'Untitled'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 shrink-0"
                            >
                              {item.language}
                            </Badge>
                            {item.tags.slice(0, 2).map((tag) => (
                              <span key={tag.id} className="text-muted-foreground/70 truncate">
                                #{tag.name}
                              </span>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="text-muted-foreground/50 shrink-0">
                                +{item.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </CommandPanel>
          <CommandFooter>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded">↑↓</kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded">↵</kbd>
                <span>select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded">esc</kbd>
                <span>close</span>
              </span>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  )
}
