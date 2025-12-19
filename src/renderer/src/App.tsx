import * as React from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SnippetProvider, useSnippetActions, useSnippetState } from '@/context/SnippetContext'
import { SnippetSidebar } from '@/components/SnippetSidebar'
import { SnippetList } from '@/components/SnippetList'
import { SnippetDetail } from '@/components/SnippetDetail'
import { TrashView } from '@/components/TrashView'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts'
import { QuickCaptureModal } from '@/components/QuickCaptureModal'
import { QuickSwitcher } from '@/components/QuickSwitcher'
import { ToastProvider, toastManager } from '@/components/ui/toast'

// Inner component that has access to context
function AppContent() {
  const createSnippet = useSnippetActions((actions) => actions.createSnippet)
  const showTrash = useSnippetState((state) => state.showTrash)
  const trashItems = useSnippetState((state) => state.trashItems)
  const restoreFromTrash = useSnippetActions((actions) => actions.restoreFromTrash)
  const permanentDelete = useSnippetActions((actions) => actions.permanentDelete)
  const emptyTrash = useSnippetActions((actions) => actions.emptyTrash)
  const setShowTrash = useSnippetActions((actions) => actions.setShowTrash)
  const [quickCapture, setQuickCapture] = React.useState<{ open: boolean; content: string }>({
    open: false,
    content: ''
  })
  const [quickSwitcherOpen, setQuickSwitcherOpen] = React.useState(false)

  const handleBackToSnippets = () => {
    setShowTrash(false)
  }

  // Global keyboard shortcuts using react-hotkeys-hook
  useKeyboardShortcut('meta+n, ctrl+n', () => createSnippet(), {
    description: 'Create new snippet',
    enableOnFormTags: true // Allow in form fields
  })

  // Quick Switcher keyboard shortcut (Cmd+K / Ctrl+K)
  useKeyboardShortcut('meta+k, ctrl+k', () => setQuickSwitcherOpen(true), {
    description: 'Open quick switcher',
    enableOnFormTags: true
  })

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

  return (
    <>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <SnippetSidebar />

          <SidebarInset className="flex flex-row p-0 m-0 gap-0">
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
                <SnippetList />
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
    </>
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
