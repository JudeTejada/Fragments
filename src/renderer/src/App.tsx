import * as React from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DropAnimation,
  pointerWithin,
  type CollisionDetection
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SnippetProvider } from '@/stores/derived'
import { useSnippetStore } from '@/stores/snippet-store'
import { useTagStore } from '@/stores/tag-store'
import { useUiStore } from '@/stores/ui-store'
import { useTrashStore } from '@/stores/trash-store'
import { SnippetSidebar } from '@/components/SnippetSidebar'
import { SnippetList } from '@/components/SnippetList'
import { SnippetDetail } from '@/components/SnippetDetail'
import { TrashView } from '@/components/TrashView'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts'
import { QuickCaptureModal } from '@/components/QuickCaptureModal'
import { QuickSwitcher } from '@/components/QuickSwitcher'
import { ToastProvider, toastManager } from '@/components/ui/toast'
import { Hash, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DragItem {
  type: 'snippet'
  id: string
  title: string
  language: string
  tags: { id: string; name: string }[]
  allSelectedIds: Set<string>
}

function DragPreview({ item, isExiting }: { item: DragItem; isExiting: boolean }) {
  const isMultiSelect = item.allSelectedIds.size > 1

  return (
    <div
      className={cn(
        'bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl',
        'px-4 py-3 rounded-xl',
        'shadow-xl shadow-black/15 dark:shadow-black/50',
        'border border-white/30 dark:border-white/10',
        'max-w-72 cursor-grabbing',
        'transition-all duration-300 ease-out',
        isExiting && 'opacity-0 scale-95 translate-y-2'
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate text-foreground">
            {isMultiSelect ? `${item.allSelectedIds.size} snippets` : item.title}
          </h3>
          {isExiting && (
            <Check className="size-4 text-green-500 ml-auto animate-in fade-in zoom-in duration-200" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-1.5 py-0 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-medium">
            {item.language}
          </span>
          {!isMultiSelect && item.tags.length > 0 && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">•</span>
              <span className="flex items-center gap-0.5">
                <Hash className="size-3" />
                {item.tags.length}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const createSnippet = useSnippetStore((s) => s.createSnippet)
  const showTrash = useUiStore((s) => s.showTrash)
  const trashItems = useTrashStore((s) => s.trashItems)
  const restoreFromTrash = useTrashStore((s) => s.restoreFromTrash)
  const permanentDelete = useTrashStore((s) => s.permanentDelete)
  const emptyTrash = useTrashStore((s) => s.emptyTrash)
  const setShowTrash = useUiStore((s) => s.setShowTrash)
  const [quickCapture, setQuickCapture] = React.useState<{ open: boolean; content: string }>({
    open: false,
    content: ''
  })
  const [quickSwitcherOpen, setQuickSwitcherOpen] = React.useState(false)
  const quickSwitcherOpenRef = React.useRef(quickSwitcherOpen)
  quickSwitcherOpenRef.current = quickSwitcherOpen

  const [activeDragItem, setActiveDragItem] = React.useState<DragItem | null>(null)
  const [dragOverTagId, setDragOverTagId] = React.useState<string | null>(null)
  const [isExiting, setIsExiting] = React.useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const updateSnippet = useSnippetStore((s) => s.updateSnippet)
  const reorderTags = useTagStore((s) => s.reorderTags)
  const tags = useTagStore((s) => s.tags)

  const handleBackToSnippets = () => {
    setShowTrash(false)
  }

  useKeyboardShortcut('meta+n, ctrl+n', () => createSnippet(), {
    description: 'Create new snippet',
    enableOnFormTags: true
  })

  useKeyboardShortcut('meta+k, ctrl+k', () => setQuickSwitcherOpen(true), {
    description: 'Open quick switcher',
    enableOnFormTags: true
  })

  React.useEffect(() => {
    const handleGlobalKeydown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ((event.metaKey || event.ctrlKey) && (event.code === 'KeyK' || key === 'k')) {
        event.preventDefault()
        setQuickSwitcherOpen(true)
        return
      }

      if (quickSwitcherOpenRef.current && (event.key === 'Escape' || event.code === 'Escape')) {
        event.preventDefault()
        setQuickSwitcherOpen(false)
      }
    }

    window.addEventListener('keydown', handleGlobalKeydown, true)
    document.addEventListener('keydown', handleGlobalKeydown, true)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeydown, true)
      document.removeEventListener('keydown', handleGlobalKeydown, true)
    }
  }, [])

  React.useEffect(() => {
    const handleQuickSwitcherOpen = () => setQuickSwitcherOpen(true)
    window.addEventListener('quick-switcher:open', handleQuickSwitcherOpen)
    return () => {
      window.removeEventListener('quick-switcher:open', handleQuickSwitcherOpen)
    }
  }, [])

  React.useEffect(() => {
    if (!window.api?.quickCapture) return

    const offNew = window.api.quickCapture.onNewSnippet(({ content }) => {
      setQuickCapture({ open: true, content })
    })

    const offError = window.api.quickCapture.onError(({ message }) => {
      toastManager.add({
        title: 'Quick capture unavailable',
        description: message,
        type: 'error'
      })
    })

    const offShortcutError = window.api.quickCapture.onShortcutError(({ shortcut, message }) => {
      toastManager.add({
        title: 'Shortcut issue',
        description: shortcut ? `${message} (${shortcut})` : message,
        type: 'error'
      })
    })

    return () => {
      offNew?.()
      offError?.()
      offShortcutError?.()
    }
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'snippet') {
      setActiveDragItem({
        type: 'snippet',
        id: active.id as string,
        title: active.data.current.title,
        language: active.data.current.language,
        tags: active.data.current.tags,
        allSelectedIds: active.data.current.allSelectedIds
      })
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const isOverTag = event.over?.data.current?.type === 'tag'
    setDragOverTagId(isOverTag ? (event.over?.id as string) : null)
  }

  const handleDragCancel = () => {
    setActiveDragItem(null)
    setDragOverTagId(null)
    setIsExiting(false)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.data.current?.type === 'snippet' && over.data.current?.type === 'tag') {
      const tagId = over.id as string
      const snippetTags = active.data.current.tags as { id: string; name: string }[]
      const tagName = over.data.current.tagName as string
      let updatedCount = 0

      if (!snippetTags.some((t) => t.id === tagId)) {
        if (active.data.current.allSelectedIds && active.data.current.allSelectedIds.size > 1) {
          for (const id of active.data.current.allSelectedIds) {
            const snippet = active.data.current.allSnippets?.find(
              (s: { id: string }) => s.id === id
            )
            if (snippet && !snippet.tags.some((t: { id: string }) => t.id === tagId)) {
              await updateSnippet({
                id,
                tags: [...snippet.tags, { id: tagId, name: over.data.current.tagName }]
              })
              updatedCount += 1
            }
          }
        } else {
          await updateSnippet({
            id: active.id as string,
            tags: [...snippetTags, { id: tagId, name: over.data.current.tagName }]
          })
          updatedCount = 1
        }
      }

      if (updatedCount > 0) {
        toastManager.add({
          title: updatedCount > 1 ? `Tagged ${updatedCount} snippets` : 'Tagged snippet',
          description: `Added to #${tagName}`,
          type: 'success'
        })
      } else {
        toastManager.add({
          title: 'Already tagged',
          description: `These snippets already have #${tagName}`,
          type: 'info'
        })
      }

      setIsExiting(true)
      setTimeout(() => {
        setActiveDragItem(null)
        setDragOverTagId(null)
        setIsExiting(false)
      }, 300)
      return
    }

    const isTagDrag = tags.some((t) => t.id === active.id)
    if (
      isTagDrag &&
      over?.data.current?.type === 'tag' &&
      active.id !== over.id
    ) {
      const oldIndex = tags.findIndex((tag) => tag.id === active.id)
      const newIndex = tags.findIndex((tag) => tag.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newTags = arrayMove(tags, oldIndex, newIndex)
        const tagIds = newTags.map((tag) => tag.id)
        await reorderTags(tagIds)
      }
    }

    setActiveDragItem(null)
    setDragOverTagId(null)
    setIsExiting(false)
  }

  const dropAnimation: DropAnimation = React.useMemo(
    () => ({
      duration: 260,
      easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)',
      keyframes({ transform }) {
        const fadeTarget = {
          ...transform.initial,
          scaleX: (transform.initial.scaleX ?? 1) * 0.92,
          scaleY: (transform.initial.scaleY ?? 1) * 0.92
        }

        return [
          { transform: CSS.Transform.toString(transform.initial), opacity: 1 },
          { transform: CSS.Transform.toString(fadeTarget), opacity: 0 }
        ]
      }
    }),
    []
  )

  const collisionDetection: CollisionDetection = React.useCallback(
    (args) => {
      if (args.active?.data.current?.type === 'snippet') {
        const intersections = pointerWithin(args)
        return intersections.length ? intersections : []
      }
      return closestCenter(args)
    },
    []
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <SnippetSidebar />

          <SidebarInset className="flex flex-row p-0 m-0 gap-0 min-w-0 overflow-hidden">
            {showTrash ? (
              <TrashView
                trashItems={trashItems}
                onRestore={restoreFromTrash}
                onPermanentDelete={permanentDelete}
                onEmptyTrash={emptyTrash}
                onBack={handleBackToSnippets}
              />
            ) : (
              <>
                <SnippetList activeDragItem={activeDragItem} dragOverTagId={dragOverTagId} />
                <SnippetDetail />
              </>
            )}
          </SidebarInset>
        </div>
      </SidebarProvider>

      <QuickSwitcher open={quickSwitcherOpen} onOpenChange={setQuickSwitcherOpen} />

      <QuickCaptureModal
        open={quickCapture.open}
        initialContent={quickCapture.content}
        onClose={() => setQuickCapture({ open: false, content: '' })}
      />

      <DragOverlay dropAnimation={dropAnimation}>
        {activeDragItem ? <DragPreview item={activeDragItem} isExiting={isExiting} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function App(): React.JSX.Element {
  return (
    <ToastProvider>
      <TooltipProvider>
        <SnippetProvider>
          <AppContent />
        </SnippetProvider>
      </TooltipProvider>
    </ToastProvider>
  )
}

export default App
