import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'
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
  children: (activeFragment: Fragment | undefined) => React.ReactNode
}

export function FragmentTabs({
  fragments,
  activeFragmentId,
  onFragmentChange,
  onAddFragment,
  onDeleteFragment,
  onRenameFragment,
  children
}: FragmentTabsProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState('')
  const [deletingFragment, setDeletingFragment] = React.useState<Fragment | null>(null)

  const activeFragment = fragments.find((f) => f.id === activeFragmentId) ?? fragments[0]

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

  // Show simple content if only one fragment
  if (fragments.length <= 1 && !activeFragment) {
    return <>{children(undefined)}</>
  }

  return (
    <div className="flex flex-col">
      {/* Fragment tabs - Minimal pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
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
                className="h-7 w-28 text-xs pr-6"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className={cn(
                  'h-7 px-3 text-xs gap-1.5 rounded-full transition-all',
                  'border border-transparent',
                  activeFragmentId === fragment.id
                    ? 'bg-muted/60 text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
                onClick={() => onFragmentChange(fragment.id)}
                onDoubleClick={() => handleDoubleClick(fragment)}
              >
                <span className="truncate max-w-20 inline-block align-middle">
                  {fragment.name}
                </span>
                <span className="text-[10px] opacity-60 ml-0.5">
                  {fragment.language}
                </span>
                {fragments.length > 1 && (
                  <span
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (fragment.content.trim()) {
                        setDeletingFragment(fragment)
                      } else {
                        onDeleteFragment(fragment.id)
                      }
                    }}
                  >
                    <X className="size-3 hover:text-destructive" />
                  </span>
                )}
              </button>
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 flex-shrink-0 rounded-full hover:bg-muted/50"
          onClick={onAddFragment}
        >
          <Plus className="size-3.5" />
          <span className="sr-only">Add fragment</span>
        </Button>
      </div>

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

      {/* Active fragment content */}
      <div className="flex-1 pt-3">{children(activeFragment)}</div>
    </div>
  )
}
