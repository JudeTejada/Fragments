import { Trash2, RotateCcw, AlertTriangle, Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
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
import type { TrashedSnippet } from '@shared/types'

interface TrashItemProps {
  snippet: TrashedSnippet
  onRestore: (id: string) => void
  onPermanentDelete: (id: string) => void
}

function TrashItem({ snippet, onRestore, onPermanentDelete }: TrashItemProps) {
  const formatDeletionInfo = (daysSinceDeleted: number, daysUntilDeletion: number) => {
    const deletedText =
      daysSinceDeleted === 0
        ? 'Deleted today'
        : `Deleted ${daysSinceDeleted} day${daysSinceDeleted === 1 ? '' : 's'} ago`
    const purgeText =
      daysUntilDeletion === 0
        ? 'Purges today'
        : `Purges in ${daysUntilDeletion} day${daysUntilDeletion === 1 ? '' : 's'}`
    return `${deletedText} • ${purgeText}`
  }

  return (
    <div
      className="group flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
      data-testid="trash-item"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-sm truncate">{snippet.title}</h3>
          <Badge variant="outline" className="text-xs">
            {snippet.language}
          </Badge>
          {snippet.isFavorite && (
            <span className="text-amber-500" data-testid="favorite-star">
              ★
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Clock className="size-3" />
          <span data-testid="deletion-info">
            {formatDeletionInfo(snippet.daysSinceDeleted, snippet.daysUntilDeletion)}
          </span>
        </div>

        {snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {snippet.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRestore(snippet.id)}
          data-testid="restore-button"
          className="transition-opacity"
        >
          <RotateCcw className="size-3 mr-1" />
          Restore
        </Button>

        <AlertDialog>
          <AlertDialogTrigger>
            <Button
              variant="destructive"
              size="sm"
              data-testid="delete-permanently-button"
              className="transition-opacity"
            >
              <AlertTriangle className="size-3 mr-1" />
              Delete Permanently
            </Button>
          </AlertDialogTrigger>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{snippet.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button
                variant="destructive"
                onClick={() => onPermanentDelete(snippet.id)}
                data-testid="confirm-permanent-delete"
              >
                Delete Forever
              </Button>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      </div>
    </div>
  )
}

interface TrashViewProps {
  trashItems: TrashedSnippet[]
  onRestore: (id: string) => void
  onPermanentDelete: (id: string) => void
  onEmptyTrash: () => void
  onBack: () => void
  isLoading?: boolean
}

export function TrashView({
  trashItems,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
  onBack,
  isLoading = false
}: TrashViewProps) {
  const getTrashStats = () => {
    const totalItems = trashItems.length
    const urgentItems = trashItems.filter((item) => item.daysUntilDeletion <= 3).length
    return { totalItems, urgentItems }
  }

  const { totalItems, urgentItems } = getTrashStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="trash-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading trash...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" data-testid="trash-view">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} data-testid="back-to-snippets">
            <ArrowLeft className="size-4 mr-1" />
          </Button>
          <h2 className="text-lg font-semibold">Recently Deleted</h2>
          {totalItems > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalItems}
              {urgentItems > 0 && ` • ${urgentItems} urgent`}
            </Badge>
          )}
        </div>

        {totalItems > 0 && (
          <AlertDialog>
            <AlertDialogTrigger>
              <Button variant="outline" size="sm" data-testid="empty-trash-button">
                <Trash2 className="size-3 mr-1" />
                Empty Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogPopup>
              <AlertDialogHeader>
                <AlertDialogTitle>Permanently Delete All?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {totalItems} item{totalItems === 1 ? '' : 's'} in
                  trash. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
                <Button
                  variant="destructive"
                  onClick={onEmptyTrash}
                  data-testid="confirm-empty-trash"
                >
                  Delete Forever
                </Button>
              </AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialog>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {totalItems === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-64 text-center"
            data-testid="trash-empty-state"
          >
            <Trash2 className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No deleted items</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Items you delete will appear here for recovery. They will be permanently removed after
              30 days.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trashItems.map((snippet) => (
              <TrashItem
                key={snippet.id}
                snippet={snippet}
                onRestore={onRestore}
                onPermanentDelete={onPermanentDelete}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
