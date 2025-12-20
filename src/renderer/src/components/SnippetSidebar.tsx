import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  SidebarFooter
} from '@/components/ui/sidebar'
import { Code2, Hash, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useSnippetActions, useSnippetState } from '@/context/SnippetContext'
import { Button, buttonVariants } from '@/components/ui/button'
import { SettingsSheet } from '@/components/SettingsSheet'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverPopup, PopoverClose } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ContextMenu, useContextMenu } from '@/components/ui/context-menu'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose
} from '@/components/ui/alert-dialog'

export function SnippetSidebar() {
  const snippets = useSnippetState((state) => state.snippets)
  const tags = useSnippetState((state) => state.tags)
  const selectedTagIds = useSnippetState((state) => state.selectedTagIds)
  const showFavoritesOnly = useSnippetState((state) => state.showFavoritesOnly)
  const trashItems = useSnippetState((state) => state.trashItems)
  const showTrash = useSnippetState((state) => state.showTrash)
  const setSelectedTagIds = useSnippetActions((actions) => actions.setSelectedTagIds)
  const setShowFavoritesOnly = useSnippetActions((actions) => actions.setShowFavoritesOnly)
  const createTag = useSnippetActions((actions) => actions.createTag)
  const updateTag = useSnippetActions((actions) => actions.updateTag)
  const deleteTag = useSnippetActions((actions) => actions.deleteTag)
  const setShowTrash = useSnippetActions((actions) => actions.setShowTrash)
  const fetchTrashItems = useSnippetActions((actions) => actions.fetchTrashItems)

  // UI state for popovers (not form state)
  const [isAddTagOpen, setIsAddTagOpen] = React.useState(false)
  const [editingTagId, setEditingTagId] = React.useState<string | null>(null)
  const [isEditPopoverOpen, setIsEditPopoverOpen] = React.useState(false)

  // Form state using TanStack Form
  const addTagForm = useForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => {
      if (value.name.trim()) {
        await createTag(value.name.trim())
        addTagForm.reset()
        setIsAddTagOpen(false)
      }
    },
  })

  const editTagForm = useForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => {
      if (editingTagId && value.name.trim()) {
        await updateTag(editingTagId, value.name.trim())
        setEditingTagId(null)
        editTagForm.reset()
        setIsEditPopoverOpen(false)
      }
    },
  })

  // State for delete confirmation
  const [deletingTagId, setDeletingTagId] = React.useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  // Context menu for tags
  const tagContextMenu = useContextMenu()

  const handleTagClick = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId))
    } else {
      setSelectedTagIds([...selectedTagIds, tagId])
    }
    // Exit trash view when clicking on tags
    handleNormalViewClick()
  }

  const clearFilters = () => {
    setSelectedTagIds([])
    setShowFavoritesOnly(false)
    // Exit trash view when clearing filters
    setShowTrash(false)
  }

  const handleRecentlyDeletedClick = async () => {
    await fetchTrashItems()
    setShowTrash(true)
  }

  const handleNormalViewClick = () => {
    setShowTrash(false)
  }

  const favoriteCount = React.useMemo(
    () => snippets.filter((snippet) => snippet.isFavorite).length,
    [snippets]
  )

  const trashCount = trashItems.length

  // Keep trash badge in sync on load
  React.useEffect(() => {
    fetchTrashItems()
  }, [fetchTrashItems])

  // Handle create tag - just delegates to form submit
  const handleCreateTag = () => addTagForm.handleSubmit()

  // Handle edit tag - just delegates to form submit
  const handleEditTag = () => editTagForm.handleSubmit()

  // Handle delete tag
  const handleDeleteTag = async () => {
    if (deletingTagId) {
      await deleteTag(deletingTagId)
      setDeletingTagId(null)
      setIsDeleteDialogOpen(false)
    }
  }

  // Handle tag right-click
  const handleTagContextMenu = (tagId: string, e: React.MouseEvent) => {
    tagContextMenu.open(e, tagId)
  }

  // Start editing a tag
  const startEditTag = () => {
    if (tagContextMenu.targetId) {
      const tag = tags.find((t) => t.id === tagContextMenu.targetId)
      if (tag) {
        setEditingTagId(tag.id)
        editTagForm.setFieldValue('name', tag.name)
        setIsEditPopoverOpen(true)
      }
    }
    tagContextMenu.close()
  }

  // Start delete confirmation
  const startDeleteTag = () => {
    if (tagContextMenu.targetId) {
      setDeletingTagId(tagContextMenu.targetId)
      setIsDeleteDialogOpen(true)
    }
    tagContextMenu.close()
  }

  // Get tag name for delete dialog
  const deletingTag = React.useMemo(
    () => tags.find((t) => t.id === deletingTagId),
    [tags, deletingTagId]
  )

  // Context menu items for tags
  const tagContextMenuItems = React.useMemo(
    () => [
      {
        label: 'Edit',
        icon: <Pencil className="size-4" />,
        onClick: startEditTag,
        testId: 'context-menu-edit-tag'
      },
      {
        label: 'Delete',
        icon: <Trash2 className="size-4" />,
        onClick: startDeleteTag,
        variant: 'destructive' as const,
        testId: 'context-menu-delete-tag'
      }
    ],
    [tagContextMenu.targetId]
  )

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-3.5 border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <SidebarTrigger className="-ml-1" />
            <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
              Fragment
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* All Snippets */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  data-testid="filter-all"
                  isActive={!showFavoritesOnly && selectedTagIds.length === 0}
                  onClick={() => {
                    clearFilters()
                    handleNormalViewClick()
                  }}
                  tooltip="All Snippets"
                  className="transition-all duration-200 ease-out"
                >
                  <Code2 className="size-4 shrink-0 transition-transform duration-200" />
                  <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                    All Snippets
                  </span>
                  <SidebarMenuBadge
                    data-testid="trash-count"
                    className="transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0"
                  >
                    {snippets.length}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  data-testid="filter-favorites"
                  isActive={showFavoritesOnly}
                  onClick={() => {
                    setShowFavoritesOnly((prev) => !prev)
                    handleNormalViewClick()
                  }}
                  tooltip="Favorites"
                  className="transition-all duration-200 ease-out"
                >
                  <Star
                    className={cn(
                      'size-4 shrink-0 transition-transform duration-200',
                      showFavoritesOnly ? 'text-amber-500 fill-amber-400' : 'text-muted-foreground'
                    )}
                  />
                  <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                    Favorites
                  </span>
                  <SidebarMenuBadge
                    data-testid="trash-count"
                    className="transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0"
                  >
                    {favoriteCount}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  data-testid="filter-recently-deleted"
                  isActive={showTrash}
                  tooltip="Recently Deleted"
                  className="transition-all duration-200 ease-out"
                  onClick={handleRecentlyDeletedClick}
                >
                  <Trash2 className="size-4 shrink-0 transition-transform duration-200" />
                  <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                    Recently Deleted
                  </span>
                  <SidebarMenuBadge
                    data-testid="trash-count"
                    className="transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0"
                  >
                    {trashCount}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tags */}
        <SidebarGroup>
          <div className="flex items-center justify-between pr-2">
            <SidebarGroupLabel className="transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-0">
              Tags
            </SidebarGroupLabel>
            <Popover open={isAddTagOpen} onOpenChange={setIsAddTagOpen}>
              <PopoverTrigger
                data-testid="add-tag-button"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  'size-6 rounded-md group-data-[collapsible=icon]:hidden'
                )}
              >
                <Plus className="size-3.5" />
                <span className="sr-only">Add Tag</span>
              </PopoverTrigger>
              <PopoverPopup className="w-64" side="right" align="start">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Add New Tag</h4>
                  <addTagForm.Field
                    name="name"
                    children={(field) => (
                      <Input
                        data-testid="new-tag-input"
                        placeholder="Tag name..."
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateTag()
                          }
                        }}
                      />
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <PopoverClose
                      render={
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      }
                    />
                    <addTagForm.Subscribe
                      selector={(state) => state.values.name.trim()}
                      children={(name) => (
                        <Button
                          size="sm"
                          onClick={handleCreateTag}
                          disabled={!name}
                          data-testid="confirm-add-tag"
                        >
                          Add
                        </Button>
                      )}
                    />
                  </div>
                </div>
              </PopoverPopup>
            </Popover>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {tags.map((tag) => (
                <SidebarMenuItem key={tag.id}>
                  <SidebarMenuButton
                    data-testid="tag-filter"
                    data-tag-id={tag.id}
                    data-tag-name={tag.name}
                    isActive={selectedTagIds.includes(tag.id)}
                    onClick={() => handleTagClick(tag.id)}
                    onContextMenu={(e) => handleTagContextMenu(tag.id, e)}
                    tooltip={`#${tag.name}`}
                    className="transition-all duration-200 ease-out"
                  >
                    <Hash className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                    <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                      {tag.name}
                    </span>
                    <SidebarMenuBadge
                      data-testid="trash-count"
                      className="transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0"
                    >
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

      {/* Tag Context Menu */}
      <ContextMenu
        open={tagContextMenu.isOpen}
        position={tagContextMenu.position}
        onClose={tagContextMenu.close}
        items={tagContextMenuItems}
      />

      {/* Edit Tag Popover - Positioned at context menu location */}
      <Popover open={isEditPopoverOpen} onOpenChange={setIsEditPopoverOpen}>
        <PopoverTrigger render={<span />} />
        <PopoverPopup className="w-64">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Edit Tag</h4>
            <editTagForm.Field
              name="name"
              children={(field) => (
                <Input
                  data-testid="edit-tag-input"
                  placeholder="Tag name..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleEditTag()
                    }
                  }}
                  autoFocus
                />
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditPopoverOpen(false)
                  setEditingTagId(null)
                  editTagForm.reset()
                }}
              >
                Cancel
              </Button>
              <editTagForm.Subscribe
                selector={(state) => state.values.name.trim()}
                children={(name) => (
                  <Button
                    size="sm"
                    onClick={handleEditTag}
                    disabled={!name}
                    data-testid="confirm-edit-tag"
                  >
                    Save
                  </Button>
                )}
              />
            </div>
          </div>
        </PopoverPopup>
      </Popover>

      {/* Delete Tag Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogTrigger render={<span />} />
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "{deletingTag?.name}"? This will remove the
              tag from all snippets. The snippets themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button
              variant="destructive"
              onClick={handleDeleteTag}
              data-testid="confirm-delete-tag"
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </Sidebar>
  )
}
