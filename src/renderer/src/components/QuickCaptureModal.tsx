import * as React from 'react'
import { X, Tag as TagIcon, Loader2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { useSnippetActions } from '@/context/SnippetContext'
import { SUPPORTED_LANGUAGES } from '@shared/types'
import { Label } from '@/components/ui/label'

type QuickCaptureModalProps = {
  open: boolean
  initialContent: string
  onClose: () => void
}

export function QuickCaptureModal({ open, initialContent, onClose }: QuickCaptureModalProps) {
  const createSnippet = useSnippetActions((actions) => actions.createSnippet)
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState(initialContent)
  const [language, setLanguage] = React.useState('plaintext')
  const [tagInput, setTagInput] = React.useState('')
  const [tags, setTags] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setTitle('')
    setContent(initialContent)
    setTags([])
    setTagInput('')
    setLanguage('plaintext')
  }, [initialContent, open])

  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      if (!value) onClose()
    },
    [onClose]
  )

  const handleAddTag = React.useCallback(() => {
    const next = tagInput.trim().toLowerCase()
    if (!next) return
    if (tags.includes(next)) {
      setTagInput('')
      return
    }
    setTags((prev) => [...prev, next])
    setTagInput('')
  }, [tagInput, tags])

  const handleRemoveTag = React.useCallback((value: string) => {
    setTags((prev) => prev.filter((tag) => tag !== value))
  }, [])

  const handleSave = React.useCallback(async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      const created = await createSnippet({
        title: title.trim() || 'Quick capture',
        language,
        content,
        tags
      })
      if (created) {
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }, [content, createSnippet, language, onClose, tags, title])

  const canSave = content.trim().length > 0 && !saving

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-w-3xl" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              Quick capture
            </div>
            <DialogTitle>Turn your clipboard into a snippet</DialogTitle>
            <DialogDescription>
              We pulled the latest text from your clipboard. Add a title, adjust language, and save
              instantly.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </DialogHeader>

        <DialogPanel className="grid gap-4 sm:grid-cols-[1fr_240px] sm:items-start">
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[320px] font-mono"
              placeholder="Your clipboard content..."
            />
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/40 p-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Language</Label>
              <Select
                value={language}
                onValueChange={(value) => {
                  if (value) setLanguage(value)
                }}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="text-sm"
                />
                <Button variant="outline" size="sm" onClick={handleAddTag}>
                  <TagIcon className="mr-2 size-4" />
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save snippet
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
