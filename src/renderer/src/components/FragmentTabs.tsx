import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { Fragment } from '@shared/types'
import { cn } from '@/lib/utils'
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

interface FragmentTabsProps {
  fragments: Fragment[]
  activeFragmentId: string | null
  onFragmentChange: (fragmentId: string) => void
  onAddFragment: () => void
  onDeleteFragment: (fragmentId: string) => void
  onRenameFragment: (fragmentId: string, newName: string) => void
}

export function FragmentTabs({
  fragments,
  activeFragmentId,
  onFragmentChange,
  onAddFragment,
  onDeleteFragment,
  onRenameFragment
}: FragmentTabsProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState('')
  const [deletingFragment, setDeletingFragment] = React.useState<Fragment | null>(null)

  const handleDoubleClick = (fragment: Fragment) => {
    setEditingId(fragment.id)
    setEditingName(fragment.name)
  }

  const handleRenameSubmit = () => {
    if (editingId && editingName.trim()) {
      onRenameFragment(editingId, editingName.trim())
    }
    setEditingId(null)
  }

  const handleDeleteConfirm = () => {
    if (deletingFragment) {
      onDeleteFragment(deletingFragment.id)
      setDeletingFragment(null)
    }
  }

  // Hide entirely if no fragments
  if (fragments.length === 0) {
    return null
  }

  return (
    <>
      {/* Fragment tabs - Text only with underline */}
      <ScrollArea className="w-full h-auto" scrollbarGutter>
        <div className="flex w-max items-center gap-4 py-1.5 px-3">
          {fragments.map((fragment) => (
            <div key={fragment.id} className="relative group flex-shrink-0">
              {editingId === fragment.id ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="h-6 w-28 text-xs pr-6"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className={cn(
                    'text-xs font-medium transition-all duration-150 relative group/tab',
                    'py-1.5 pl-2 pr-6 rounded-md select-none',
                    activeFragmentId === fragment.id
                      ? 'text-blue-500'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => onFragmentChange(fragment.id)}
                  onDoubleClick={() => handleDoubleClick(fragment)}
                >
                  <span className="truncate max-w-24 inline-block align-middle">
                    {fragment.name}
                  </span>
                  
                  {/* Active underline */}
                  {activeFragmentId === fragment.id && (
                    <span className="absolute bottom-0.5 left-2 right-6 h-0.5 bg-blue-500 rounded-full" />
                  )}

                  {/* Delete X on hover */}
                  {fragments.length > 1 && (
                    <span
                      className="opacity-0 group-hover/tab:opacity-100 transition-all duration-200 absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted-foreground/10 text-muted-foreground/50 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (fragment.content.trim()) {
                          setDeletingFragment(fragment)
                        } else {
                          onDeleteFragment(fragment.id)
                        }
                      }}
                    >
                      <X className="size-3" />
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
          {/* Add button - borderless icon */}
          <button
            type="button"
            onClick={onAddFragment}
            className={cn(
              'p-1 rounded-sm transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-muted/30',
              'flex-shrink-0 ml-auto'
            )}
            title="Add fragment"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deletingFragment}
        onOpenChange={(open) => !open && setDeletingFragment(null)}
      >
        <AlertDialogTrigger>
          <span className="hidden" />
        </AlertDialogTrigger>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fragment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingFragment?.name}&quot;? This fragment
              has content that will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose>Cancel</AlertDialogClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  )
}
