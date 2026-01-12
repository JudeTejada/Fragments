import * as React from 'react'
import { Code2, Star, Trash2 } from 'lucide-react'
import { useSnippetStore } from '@/stores/snippet-store'
import { useUiStore } from '@/stores/ui-store'
import { useTrashStore } from '@/stores/trash-store'
import { SidebarGroup, SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar'
import { SidebarMenuItemComponent } from './SidebarMenuItem'
import { cn } from '@/lib/utils'

interface SidebarFilterSectionProps {
  className?: string
}

export function SidebarFilterSection({ className }: SidebarFilterSectionProps) {
  const snippets = useSnippetStore((s) => s.snippets)
  const showFavoritesOnly = useUiStore((s) => s.showFavoritesOnly)
  const trashItems = useTrashStore((s) => s.trashItems)
  const showTrash = useUiStore((s) => s.showTrash)
  const selectedTagIds = useUiStore((s) => s.selectedTagIds)

  const setShowFavoritesOnly = useUiStore((s) => s.setShowFavoritesOnly)
  const setShowTrash = useUiStore((s) => s.setShowTrash)
  const setSelectedTagIds = useUiStore((s) => s.setSelectedTagIds)
  const fetchTrashItems = useTrashStore((s) => s.fetchTrashItems)

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
