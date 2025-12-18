import * as React from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SnippetProvider, useSnippetActions } from '@/context/SnippetContext'
import { SnippetSidebar } from '@/components/SnippetSidebar'
import { SnippetList } from '@/components/SnippetList'
import { SnippetDetail } from '@/components/SnippetDetail'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts'
import { QuickCaptureModal } from '@/components/QuickCaptureModal'
import { ToastProvider, toastManager } from '@/components/ui/toast'

// Inner component that has access to context
function AppContent() {
  const createSnippet = useSnippetActions((state) => state.createSnippet)
  const [quickCapture, setQuickCapture] = React.useState<{ open: boolean; content: string }>({
    open: false,
    content: ''
  })

  // Global keyboard shortcuts using react-hotkeys-hook
  useKeyboardShortcut('meta+n, ctrl+n', () => createSnippet(), {
    description: 'Create new snippet',
    enableOnFormTags: true // Allow in form fields
  })

  useKeyboardShortcut(
    'meta+f, ctrl+f',
    () => {
      // Find and focus the search input
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
      searchInput?.focus()
    },
    {
      description: 'Focus search input',
      enableOnFormTags: true // Allow in form fields
    }
  )

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
            <SnippetList />

            <SnippetDetail />
          </SidebarInset>
        </div>
      </SidebarProvider>

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
