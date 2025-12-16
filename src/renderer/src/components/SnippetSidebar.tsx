import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Code2, Hash, Plus, Search } from 'lucide-react';
import { useSnippetContext } from '@/context/SnippetContext';
import { Button } from '@/components/ui/button';
import { SettingsSheet } from '@/components/SettingsSheet';

export function SnippetSidebar() {
  const {
    tags,
    selectedTagIds,
    searchQuery,
    filteredSnippets,
    setSelectedTagIds,
    setSearchQuery,
    createSnippet,
  } = useSnippetContext();

  const handleTagClick = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const clearFilters = () => {
    setSelectedTagIds([]);
    setSearchQuery('');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-3.5 border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <SidebarTrigger className="-ml-1" />
            <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
              Snippets
            </span>
          </div>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
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
        </div>
        <div className="relative group-data-[collapsible=icon]:hidden">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <SidebarInput
            data-search-input
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* All Snippets */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={selectedTagIds.length === 0}
                  onClick={clearFilters}
                  tooltip="All Snippets"
                  className="transition-all duration-200 ease-out"
                >
                  <Code2 className="size-4 shrink-0 transition-transform duration-200" />
                  <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                    All Snippets
                  </span>
                  <SidebarMenuBadge className="transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0">
                    {filteredSnippets.length}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tags */}
        <SidebarGroup>
          <SidebarGroupLabel className="transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-0">
            Tags
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tags.map((tag) => (
                <SidebarMenuItem key={tag.id}>
                  <SidebarMenuButton
                    isActive={selectedTagIds.includes(tag.id)}
                    onClick={() => handleTagClick(tag.id)}
                    tooltip={`#${tag.name}`}
                    className="transition-all duration-200 ease-out"
                  >
                    <Hash className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                    <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                      {tag.name}
                    </span>
                    <SidebarMenuBadge className="transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0">
                      {tag.count}
                    </SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {tags.length === 0 && (
                <p className="px-2 py-4 text-xs text-muted-foreground transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
                  No tags yet
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Settings */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center">
          <SettingsSheet />
        </div>
      </SidebarFooter>

      {/* Rail for collapse/expand interaction */}
      <SidebarRail />
    </Sidebar>
  );
}

