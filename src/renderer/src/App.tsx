import * as React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SnippetProvider, useSnippetContext } from '@/context/SnippetContext';
import { SnippetSidebar } from '@/components/SnippetSidebar';
import { SnippetList } from '@/components/SnippetList';
import { SnippetDetail } from '@/components/SnippetDetail';

// Inner component that has access to context
function AppContent() {
  const { createSnippet } = useSnippetContext();

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + N: New snippet
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        createSnippet();
      }

      // Cmd/Ctrl + F: Focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault();
        // Find and focus the search input
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [createSnippet]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Left Sidebar - Tags & Search */}
        <SnippetSidebar />

        {/* Main Content Area */}
        <SidebarInset className="flex flex-row p-0 m-0 gap-0">
          {/* Middle - Snippet List */}
          <SnippetList />

          {/* Right - Snippet Detail */}
          <SnippetDetail />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function App(): React.JSX.Element {
  return (
    <SnippetProvider>
      <AppContent />
    </SnippetProvider>
  );
}

export default App;

