import * as React from 'react'
import { Code2, Star, Trash2 } from 'lucide-react'
import { useSnippetActions, useSnippetState } from '@/context/SnippetContext'
import { SidebarGroup, SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar'
import { SidebarMenuItemComponent } from './SidebarMenuItem'
import { cn } from '@/lib/utils'

interface SidebarFilterSectionProps {
  className?: string
}

export function SidebarFilterSection({ className }: SidebarFilterSectionProps) {
  const snippets = useSnippetState((state) => state.snippets)
  const showFavoritesOnly = useSnippetState((state) => state.showFavoritesOnly)
  const trashItems = useSnippetState((state) => state.trashItems)
  const showTrash = useSnippetState((state) => state.showTrash)
  const selectedTagIds = useSnippetState((state) => state.selectedTagIds)

  const setShowFavoritesOnly = useSnippetActions((actions) => actions.setShowFavoritesOnly)
  const setShowTrash = useSnippetActions((actions) => actions.setShowTrash)
  const setSelectedTagIds = useSnippetActions((actions) => actions.setSelectedTagIds)
  const fetchTrashItems = useSnippetActions((actions) => actions.fetchTrashItems)

  const favoriteCount = React.useMemo(
    () => snippets.filter((snippet) => snippet.isFavorite).length,
    [snippets]
  )

  const clearFilters = () => {
    setSelectedTagIds([])
    setShowFavoritesOnly(false)
  }

  const handleNormalViewClick = () => {
    setShowTrash(false)
  }

  const handleRecentlyDeletedClick = async () => {
    await fetchTrashItems()
    setShowTrash(true)
  }

  const isAllActive = !showFavoritesOnly && selectedTagIds.length === 0 && !showTrash

  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItemComponent
            icon={Code2}
            label="All Snippets"
            count={snippets.length}
            isActive={isAllActive}
            testId="filter-all"
            onClick={() => {
              clearFilters()
              handleNormalViewClick()
            }}
          />
          <SidebarMenuItemComponent
            icon={Star}
            label="Favorites"
            count={favoriteCount}
            isActive={showFavoritesOnly}
            iconClassName={cn(
              showFavoritesOnly ? 'text-amber-500 fill-amber-400' : 'text-muted-foreground'
            )}
            testId="filter-favorites"
            onClick={() => {
              setShowFavoritesOnly((prev) => !prev)
              handleNormalViewClick()
            }}
          />
          <SidebarMenuItemComponent
            icon={Trash2}
            label="Recently Deleted"
            count={trashItems.length}
            isActive={showTrash}
            testId="filter-recently-deleted"
            onClick={handleRecentlyDeletedClick}
          />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
