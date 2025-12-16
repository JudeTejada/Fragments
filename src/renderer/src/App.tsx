import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SnippetProvider } from '@/context/SnippetContext';
import { SnippetSidebar } from '@/components/SnippetSidebar';
import { SnippetList } from '@/components/SnippetList';
import { SnippetDetail } from '@/components/SnippetDetail';

function App(): React.JSX.Element {

  return (
    <SnippetProvider>
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
    </SnippetProvider>
  );
}

export default App;
