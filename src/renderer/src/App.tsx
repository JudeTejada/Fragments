import * as React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SnippetProvider, useSnippetContext } from '@/context/SnippetContext';
import { SnippetSidebar } from '@/components/SnippetSidebar';
import { SnippetList } from '@/components/SnippetList';
import { SnippetDetail } from '@/components/SnippetDetail';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

// Inner component that has access to context
function AppContent() {
  const { createSnippet } = useSnippetContext();

  // Global keyboard shortcuts using react-hotkeys-hook
  useKeyboardShortcut(
    'cmd+n, ctrl+n',
    () => createSnippet(),
    {
      description: 'Create new snippet',
      enableOnFormTags: true // Allow in form fields
    }
  );

  useKeyboardShortcut(
    'cmd+f, ctrl+f',
    () => {
      // Find and focus the search input
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
      searchInput?.focus();
    },
    {
      description: 'Focus search input',
      enableOnFormTags: true // Allow in form fields
    }
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <SnippetSidebar />

        <SidebarInset className="flex flex-row p-0 m-0 gap-0">
          <SnippetList />

          <SnippetDetail />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function App(): React.JSX.Element {
  return (
    <TooltipProvider>
      <SnippetProvider>
        <AppContent />
      </SnippetProvider>
    </TooltipProvider>
  );
}

export default App;
