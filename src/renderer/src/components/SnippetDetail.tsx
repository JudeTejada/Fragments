import * as React from 'react'
import { useSelectedSnippet, useSnippetActions, useSnippetState } from '@/context/SnippetContext'
import { CodeEditor } from '@/components/CodeEditor'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import { AiActionType } from '@shared/types'
import { useAiForSnippet } from '@/hooks/useAiForSnippet'
import { FragmentTabs } from '@/components/FragmentTabs'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Code2,
  Trash2,
  Check,
  X,
  Loader2,
  Sparkles,
  MessageSquareText,
  PencilLine,
  BookOpen,
  Star,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

// Auto-save debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

const ACTION_LABELS: Record<AiActionType, string> = {
  explain: 'Explain',
  comment: 'Add comments',
  usage_example: 'Usage example'
}

// ContentEditable title component
function EditableTitle({
  value,
  onChange,
  className
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const spanRef = React.useRef<HTMLSpanElement>(null)
  const [isEditing, setIsEditing] = React.useState(false)

  const handleBlur = () => {
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      spanRef.current?.blur()
    }
  }

  const handleInput = () => {
    if (spanRef.current) {
      onChange(spanRef.current.textContent || '')
    }
  }

  return (
    <span
      ref={spanRef}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={cn(
        'outline-none transition-colors duration-200',
        isEditing && 'bg-muted/30',
        className
      )}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  )
}

export function SnippetDetail() {
  const selectedSnippet = useSelectedSnippet()
  const isSaving = useSnippetState((state) => state.isSaving)
  const tags = useSnippetState((state) => state.tags)
  const updateSnippet = useSnippetActions((actions) => actions.updateSnippet)
  const deleteSnippet = useSnippetActions((actions) => actions.deleteSnippet)
  const toggleFavorite = useSnippetActions((actions) => actions.toggleFavorite)
  const refreshData = useSnippetActions((actions) => actions.refreshData)

  // Local state for editing
  const [title, setTitle] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [tagInput, setTagInput] = React.useState('')
  const [showSaved, setShowSaved] = React.useState(false)
  const skipAutoSaveRef = React.useRef(false)

  // Fragment-specific state
  const [activeFragmentId, setActiveFragmentId] = React.useState<string | null>(null)
  const [fragmentContents, setFragmentContents] = React.useState<Record<string, string>>({})

  // UI state
  const [notesExpanded, setNotesExpanded] = React.useState(true)
  const [aiExpanded, setAiExpanded] = React.useState(false)

  const {
    aiRuns,
    loadingType,
    error: aiError,
    isConfigured: isAiConfigured,
    settingsMessage: aiSettingsMessage,
    run: runAiAction
  } = useAiForSnippet(selectedSnippet?.id ?? null)

  // Get current active fragment
  const activeFragment = React.useMemo(() => {
    if (!selectedSnippet?.fragments) return undefined
    return selectedSnippet.fragments.find((f) => f.id === activeFragmentId) ?? selectedSnippet.fragments[0]
  }, [selectedSnippet?.fragments, activeFragmentId])

  // Get current fragment content (from local state or fragment data)
  const currentFragmentContent = activeFragment
    ? fragmentContents[activeFragment.id] ?? activeFragment.content
    : ''

  // Sync local state when selected snippet changes
  React.useEffect(() => {
    if (selectedSnippet) {
      skipAutoSaveRef.current = true
      setTitle(selectedSnippet.title)
      setNotes(selectedSnippet.notes ?? '')

      // Initialize fragment state
      if (selectedSnippet.fragments?.length > 0) {
        setActiveFragmentId(selectedSnippet.fragments[0].id)
        // Initialize fragment contents from snippet data
        const contents: Record<string, string> = {}
        selectedSnippet.fragments.forEach((f) => {
          contents[f.id] = f.content
        })
        setFragmentContents(contents)
      } else {
        setActiveFragmentId(null)
        setFragmentContents({})
      }
    }
  }, [selectedSnippet?.id])

  // Debounced values for auto-save (title and notes only, fragment content saved separately)
  const debouncedTitle = useDebounce(title, 500)
  const debouncedNotes = useDebounce(notes, 500)

  // Auto-save effect for title and notes
  React.useEffect(() => {
    if (!selectedSnippet) return
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false
      return
    }
    const isDebounceStale = debouncedTitle !== title || debouncedNotes !== notes
    if (isDebounceStale) return

    const hasChanges =
      debouncedTitle !== selectedSnippet.title ||
      debouncedNotes !== (selectedSnippet.notes ?? '')

    if (hasChanges) {
      updateSnippet({
        id: selectedSnippet.id,
        title: debouncedTitle,
        notes: debouncedNotes || null
      })

      // Show saved indicator
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [
    debouncedTitle,
    debouncedNotes,
    selectedSnippet,
    title,
    notes,
    updateSnippet
  ])

  // Fragment content change handler (with debounced save)
  const debouncedFragmentContent = useDebounce(currentFragmentContent, 500)

  React.useEffect(() => {
    if (!activeFragment || !selectedSnippet) return
    if (skipAutoSaveRef.current) return

    // Check if content has actually changed from the fragment's stored content
    if (debouncedFragmentContent !== activeFragment.content) {
      window.api.fragments.update({
        id: activeFragment.id,
        content: debouncedFragmentContent
      }).then((result) => {
        if (result.success) {
          refreshData() // Refresh snippet data to sync state
          setShowSaved(true)
          setTimeout(() => setShowSaved(false), 2000)
        }
      })
    }
  }, [debouncedFragmentContent, activeFragment?.id, activeFragment?.content, selectedSnippet, refreshData])

  // Handle fragment content change (local state update)
  const handleFragmentContentChange = (content: string) => {
    if (!activeFragment) return
    setFragmentContents((prev) => ({
      ...prev,
      [activeFragment.id]: content
    }))
  }

  // Handle fragment language change (immediate save)
  const handleFragmentLanguageChange = (fragmentId: string, language: string) => {
    if (!selectedSnippet) return
    window.api.fragments.update({ id: fragmentId, language }).then((result) => {
      if (result.success) {
        refreshData()
      }
    })
  }

  // Listen for language change events from CodeEditor
  React.useEffect(() => {
    const handleLanguageChange = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (activeFragment && detail?.language) {
        handleFragmentLanguageChange(activeFragment.id, detail.language)
      }
    }

    window.addEventListener('snippet:change-language', handleLanguageChange)
    return () => window.removeEventListener('snippet:change-language', handleLanguageChange)
  }, [activeFragment])

  // Handle add new fragment
  const handleAddFragment = async () => {
    if (!selectedSnippet) return
    const result = await window.api.fragments.create({
      snippetId: selectedSnippet.id,
      language: 'plaintext'
    })
    if (result.success && result.data) {
      await refreshData()
      setActiveFragmentId(result.data.id)
    }
  }

  // Handle delete fragment
  const handleDeleteFragment = async (fragmentId: string) => {
    const result = await window.api.fragments.delete(fragmentId)
    if (result.success) {
      await refreshData()
      // If we deleted the active fragment, switch to the first one
      if (fragmentId === activeFragmentId && selectedSnippet?.fragments) {
        const remaining = selectedSnippet.fragments.filter((f) => f.id !== fragmentId)
        if (remaining.length > 0) {
          setActiveFragmentId(remaining[0].id)
        }
      }
    }
  }

  // Handle rename fragment
  const handleRenameFragment = async (fragmentId: string, newName: string) => {
    const result = await window.api.fragments.update({ id: fragmentId, name: newName })
    if (result.success) {
      await refreshData()
    }
  }

  // Handle tag removal
  const handleRemoveTag = (tagId: string) => {
    if (!selectedSnippet) return
    updateSnippet({
      id: selectedSnippet.id,
      tags: selectedSnippet.tags.filter((t) => t.id !== tagId)
    })
  }

  // Handle adding a tag (existing or new)
  const handleAddTag = (tagValue: string | null) => {
    if (!selectedSnippet || !tagValue) return

    // Check if it's an existing tag ID or a new tag name
    const existingTag = tags.find((t) => t.id === tagValue)

    if (existingTag) {
      // Add existing tag (check if already assigned)
      if (selectedSnippet.tags.some((t) => t.id === existingTag.id)) return
      updateSnippet({
        id: selectedSnippet.id,
        tags: [...selectedSnippet.tags, { id: existingTag.id, name: existingTag.name }]
      })
    } else {
      // Create new tag with the input value
      const newTag = {
        id: crypto.randomUUID(),
        name: tagValue.trim().toLowerCase()
      }
      // Check if tag with same name already exists
      if (selectedSnippet.tags.some((t) => t.name.toLowerCase() === newTag.name)) return
      updateSnippet({
        id: selectedSnippet.id,
        tags: [...selectedSnippet.tags, newTag]
      })
    }
    setTagInput('')
  }

  // Handle delete
  const handleDelete = () => {
    if (selectedSnippet) {
      deleteSnippet(selectedSnippet.id)
    }
  }

  const handleFavoriteToggle = () => {
    if (!selectedSnippet) return
    toggleFavorite(selectedSnippet.id)
  }

  if (!selectedSnippet) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Empty className="border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Code2 className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Select a snippet</EmptyTitle>
            <EmptyDescription>Choose one from the sidebar or press Cmd+N to create</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-background relative">
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-4xl p-8 space-y-8">
          {/* Title - Hero */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h1
                className={cn(
                  'text-3xl font-medium text-foreground min-h-[2.5rem] py-1',
                  'outline-none transition-colors duration-200',
                  'hover:bg-muted/20 rounded-md -mx-2 px-2',
                  !title && 'before:content-[attr(data-placeholder)] before:text-muted-foreground/50 before:pointer-events-none'
                )}
                data-placeholder="Snippet title..."
              >
                <EditableTitle
                  value={title}
                  onChange={setTitle}
                />
              </h1>
              <div className="flex items-center gap-2 pt-1">
                <span
                  className={cn(
                    'text-xs text-muted-foreground transition-all duration-300 flex items-center gap-1.5',
                    isSaving || showSaved ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Check className="size-3" />
                      Saved
                    </>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'size-8 rounded-full transition-all',
                    selectedSnippet.isFavorite
                      ? 'text-amber-500 bg-amber-50'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={handleFavoriteToggle}
                >
                  <Star
                    className={cn(
                      'size-4',
                      selectedSnippet.isFavorite && 'fill-current'
                    )}
                  />
                  <span className="sr-only">
                    {selectedSnippet.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Move to Trash</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Code Editor - Main Focus */}
          <div className="space-y-3">
            <FragmentTabs
              fragments={selectedSnippet.fragments}
              activeFragmentId={activeFragmentId}
              onFragmentChange={setActiveFragmentId}
              onAddFragment={handleAddFragment}
              onDeleteFragment={handleDeleteFragment}
              onRenameFragment={handleRenameFragment}
            >
              {(fragment) =>
                fragment && (
                  <CodeEditor
                    value={fragmentContents[fragment.id] ?? fragment.content}
                    language={fragment.language}
                    onChange={handleFragmentContentChange}
                    className="min-h-[350px]"
                  />
                )
              }
            </FragmentTabs>
          </div>

          {/* Notes - Collapsible */}
          <div className="space-y-2">
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {notesExpanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              Notes
            </button>
            <AnimatePresence>
              {notesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this snippet..."
                    className="min-h-[100px] resize-none bg-muted/10 border-border/30 rounded-xl focus:bg-muted/20 transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tags - Fixed at bottom */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {selectedSnippet.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="gap-1.5 pr-2 h-6 text-xs bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  #{tag.name}
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                    aria-label={`Remove ${tag.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault()
                      handleAddTag(tagInput.trim())
                    }
                  }}
                  placeholder="+ Tag"
                  className="h-6 w-16 min-w-[5.5rem] text-xs bg-transparent px-1.5 rounded-md transition-all focus:w-28 focus:outline-none focus:ring-1 focus:ring-ring/20 placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          </div>

          {/* AI Assistant - Collapsible sheet */}
          <div className="space-y-2">
            <button
              onClick={() => setAiExpanded(!aiExpanded)}
              className={cn(
                'flex items-center gap-2 text-xs font-medium transition-colors w-full',
                aiExpanded ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className={cn('size-3.5', aiExpanded && 'text-amber-500')} />
              AI Assistant
              {aiExpanded ? (
                <ChevronDown className="size-3.5 ml-auto" />
              ) : (
                <ChevronRight className="size-3.5 ml-auto" />
              )}
            </button>
            <AnimatePresence>
              {aiExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 space-y-4">
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 h-8"
                        onClick={() => runAiAction('explain')}
                        disabled={!selectedSnippet || !isAiConfigured || Boolean(loadingType)}
                      >
                        {loadingType === 'explain' ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <MessageSquareText className="size-3.5" />
                        )}
                        Explain
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 h-8"
                        onClick={() => runAiAction('comment')}
                        disabled={!selectedSnippet || !isAiConfigured || Boolean(loadingType)}
                      >
                        {loadingType === 'comment' ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <PencilLine className="size-3.5" />
                        )}
                        Add comments
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 h-8"
                        onClick={() => runAiAction('usage_example')}
                        disabled={!selectedSnippet || !isAiConfigured || Boolean(loadingType)}
                      >
                        {loadingType === 'usage_example' ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <BookOpen className="size-3.5" />
                        )}
                        Usage example
                      </Button>
                    </div>

                    {/* Configuration notice */}
                    {!isAiConfigured && (
                      <div className="flex items-start gap-2.5 rounded-lg bg-amber-50/80 px-3 py-2.5 text-xs text-amber-900 border border-amber-200/50">
                        <Sparkles className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p>
                          {aiSettingsMessage ?? 'Enable AI in Settings to use your local model.'}
                        </p>
                      </div>
                    )}

                    {/* Error */}
                    {aiError && (
                      <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-xs text-destructive border border-destructive/20">
                        {aiError}
                      </div>
                    )}

                    {/* Results */}
                    <div className="space-y-3 max-h-64 overflow-auto pr-1">
                      {aiRuns.map((run) => (
                        <article
                          key={run.id}
                          className="rounded-lg bg-muted/30 px-3 py-2.5 text-xs border border-border/30"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide h-5">
                              {ACTION_LABELS[run.type]}
                            </Badge>
                            <span className="text-muted-foreground text-[10px]">
                              {new Date(run.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <pre className="whitespace-pre-wrap font-mono leading-relaxed text-foreground/80">
                            {run.result}
                          </pre>
                        </article>
                      ))}
                      {aiRuns.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          Run an action above to get AI assistance.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
