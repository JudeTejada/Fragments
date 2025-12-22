import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Hash, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge
} from '@/components/ui/sidebar'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { useSnippetActions, useSnippetState } from '@/context/SnippetContext'
import { cn } from '@/lib/utils'
import type { Tag } from '@shared/types'

interface SidebarTagSectionProps {
  className?: string
}

function SortableTagItem({
  tag,
  isActive,
  onClick,
  onContextMenu
}: {
  tag: Tag
  isActive: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useSortable({ id: tag.id })

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined
  }

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <SidebarMenuButton
        data-testid="tag-filter"
        data-tag-id={tag.id}
        data-tag-name={tag.name}
        isActive={isActive}
        onClick={onClick}
        onContextMenu={onContextMenu}
        tooltip={`#${tag.name}`}
        className={cn(
          'transition-all duration-200 ease-out cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-50 ring-2 ring-primary'
        )}
        {...attributes}
        {...listeners}
      >
        <Hash className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
          {tag.name}
        </span>
        <SidebarMenuBadge
          data-testid="tag-count"
          className="transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0"
        >
          {tag.count}
        </SidebarMenuBadge>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function SidebarTagSection({ className }: SidebarTagSectionProps) {
  const tags = useSnippetState((state) => state.tags)
  const selectedTagIds = useSnippetState((state) => state.selectedTagIds)

  const setSelectedTagIds = useSnippetActions((actions) => actions.setSelectedTagIds)
  const createTag = useSnippetActions((actions) => actions.createTag)
  const updateTag = useSnippetActions((actions) => actions.updateTag)
  const deleteTag = useSnippetActions((actions) => actions.deleteTag)
  const reorderTags = useSnippetActions((actions) => actions.reorderTags)
  const setShowTrash = useSnippetActions((actions) => actions.setShowTrash)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const [isAddTagOpen, setIsAddTagOpen] = React.useState(false)
  const [editingTagId, setEditingTagId] = React.useState<string | null>(null)
  const [isEditPopoverOpen, setIsEditPopoverOpen] = React.useState(false)
  const [deletingTagId, setDeletingTagId] = React.useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const tagContextMenu = useContextMenu()

  const addTagForm = useForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => {
      if (value.name.trim()) {
        await createTag(value.name.trim())
        addTagForm.reset()
        setIsAddTagOpen(false)
      }
    }
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
    }
  })

  const handleTagClick = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId))
    } else {
      setSelectedTagIds([...selectedTagIds, tagId])
    }
    setShowTrash(false)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = tags.findIndex((tag) => tag.id === active.id)
      const newIndex = tags.findIndex((tag) => tag.id === over.id)
      const newTags = arrayMove(tags, oldIndex, newIndex)
      const tagIds = newTags.map((tag) => tag.id)
      await reorderTags(tagIds)
    }
  }

  const handleCreateTag = () => addTagForm.handleSubmit()
  const handleEditTag = () => editTagForm.handleSubmit()

  const handleDeleteTag = async () => {
    if (deletingTagId) {
      await deleteTag(deletingTagId)
      setDeletingTagId(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleTagContextMenu = (tagId: string, e: React.MouseEvent) => {
    tagContextMenu.open(e, tagId)
  }

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

  const startDeleteTag = () => {
    if (tagContextMenu.targetId) {
      setDeletingTagId(tagContextMenu.targetId)
      setIsDeleteDialogOpen(true)
    }
    tagContextMenu.close()
  }

  const deletingTag = React.useMemo(
    () => tags.find((t) => t.id === deletingTagId),
    [tags, deletingTagId]
  )

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SidebarGroup className={className}>
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
            <SortableContext
              items={tags.map((tag) => tag.id)}
              strategy={verticalListSortingStrategy}
            >
              {tags.map((tag) => (
                <SortableTagItem
                  key={tag.id}
                  tag={tag}
                  isActive={selectedTagIds.includes(tag.id)}
                  onClick={() => handleTagClick(tag.id)}
                  onContextMenu={(e) => handleTagContextMenu(tag.id, e)}
                />
              ))}
            </SortableContext>
            {tags.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
                No tags yet
              </p>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Tag Context Menu */}
      <ContextMenu
        open={tagContextMenu.isOpen}
        position={tagContextMenu.position}
        onClose={tagContextMenu.close}
        items={tagContextMenuItems}
      />

      {/* Edit Tag Popover */}
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
    </DndContext>
  )
}
