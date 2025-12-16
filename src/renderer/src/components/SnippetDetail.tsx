import * as React from 'react';
import { useSnippetContext } from '@/context/SnippetContext';
import { CodeEditor } from '@/components/CodeEditor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardPanel } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Code2, Trash2, Check, X, Plus, Loader2, Sparkles, MessageSquareText, PencilLine, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiActionType, SUPPORTED_LANGUAGES } from '@shared/types';
import { useAiForSnippet } from '@/hooks/useAiForSnippet';

// Auto-save debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

const ACTION_LABELS: Record<AiActionType, string> = {
  explain: 'Explain',
  comment: 'Add comments',
  usage_example: 'Usage example',
};

export function SnippetDetail() {
  const { selectedSnippet, updateSnippet, deleteSnippet, isSaving } = useSnippetContext();

  // Local state for editing
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [language, setLanguage] = React.useState('plaintext');
  const [tagInput, setTagInput] = React.useState('');
  const [showSaved, setShowSaved] = React.useState(false);

  const {
    aiRuns,
    loadingType,
    error: aiError,
    isConfigured: isAiConfigured,
    settingsMessage: aiSettingsMessage,
    run: runAiAction,
  } = useAiForSnippet(selectedSnippet?.id ?? null);

  // Sync local state when selected snippet changes
  React.useEffect(() => {
    if (selectedSnippet) {
      setTitle(selectedSnippet.title);
      setContent(selectedSnippet.content);
      setNotes(selectedSnippet.notes ?? '');
      setLanguage(selectedSnippet.language);
    }
  }, [selectedSnippet?.id]);

  // Debounced values for auto-save
  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);
  const debouncedNotes = useDebounce(notes, 500);

  // Auto-save effect
  React.useEffect(() => {
    if (!selectedSnippet) return;

    const hasChanges =
      debouncedTitle !== selectedSnippet.title ||
      debouncedContent !== selectedSnippet.content ||
      debouncedNotes !== (selectedSnippet.notes ?? '');

    if (hasChanges) {
      updateSnippet({
        id: selectedSnippet.id,
        title: debouncedTitle,
        content: debouncedContent,
        notes: debouncedNotes || null,
      });

      // Show saved indicator
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [debouncedTitle, debouncedContent, debouncedNotes, selectedSnippet, updateSnippet]);

  // Handle language change (immediate save)
  const handleLanguageChange = (value: string | null) => {
    if (!value) return;
    setLanguage(value);
    if (selectedSnippet) {
      updateSnippet({ id: selectedSnippet.id, language: value });
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagId: string) => {
    if (!selectedSnippet) return;
    updateSnippet({
      id: selectedSnippet.id,
      tags: selectedSnippet.tags.filter(t => t.id !== tagId),
    });
  };

  // Handle adding new tag
  const handleAddTag = () => {
    if (!selectedSnippet || !tagInput.trim()) return;
    const newTag = {
      id: crypto.randomUUID(),
      name: tagInput.trim().toLowerCase(),
    };
    updateSnippet({
      id: selectedSnippet.id,
      tags: [...selectedSnippet.tags, newTag],
    });
    setTagInput('');
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedSnippet) {
      deleteSnippet(selectedSnippet.id);
    }
  };

  if (!selectedSnippet) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Empty className="border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Code2 className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No snippet selected</EmptyTitle>
            <EmptyDescription>
              Select a snippet from the list or create a new one
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-4xl p-6 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            {/* Title + Actions */}
            <div className="flex items-start justify-between gap-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Snippet title..."
                className="text-xl font-semibold border-none shadow-none px-0 h-auto bg-transparent focus-visible:ring-0"
                unstyled
              />
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs text-muted-foreground transition-opacity duration-300 flex items-center',
                    (isSaving || showSaved) ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="size-3 mr-1" />
                      Saved
                    </>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>

            {/* Language + Tags */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger size="sm" className="w-36">
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

              <div className="flex flex-wrap items-center gap-2">
                {selectedSnippet.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    #{tag.name}
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <div className="flex items-center gap-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag..."
                    size="sm"
                    className="w-24 h-6 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Code
            </label>
            <CodeEditor
              value={content}
              language={language}
              onChange={setContent}
              className="min-h-[300px]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this snippet..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* AI Assistant */}
          <Card className="border border-dashed border-muted-foreground/40 bg-muted/30">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">AI assistant</CardTitle>
                <CardDescription>Runs locally via Ollama; no cloud calls.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => runAiAction('explain')}
                  disabled={!selectedSnippet || !isAiConfigured || Boolean(loadingType)}
                >
                  {loadingType === 'explain' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MessageSquareText className="size-4" />
                  )}
                  {loadingType === 'explain' ? 'Explaining...' : 'Explain'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => runAiAction('comment')}
                  disabled={!selectedSnippet || !isAiConfigured || Boolean(loadingType)}
                >
                  {loadingType === 'comment' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <PencilLine className="size-4" />
                  )}
                  {loadingType === 'comment' ? 'Commenting...' : 'Add comments'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => runAiAction('usage_example')}
                  disabled={!selectedSnippet || !isAiConfigured || Boolean(loadingType)}
                >
                  {loadingType === 'usage_example' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <BookOpen className="size-4" />
                  )}
                  {loadingType === 'usage_example' ? 'Generating...' : 'Usage example'}
                </Button>
              </div>
            </CardHeader>
            <CardPanel className="space-y-3 pt-0">
              {!isAiConfigured && (
                <div className="flex items-start gap-3 rounded-xl border border-dashed border-amber-300/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
                  <Sparkles className="mt-0.5 size-4 text-amber-600" />
                  <div className="space-y-1">
                    <p className="font-medium">AI disabled</p>
                    <p className="text-xs text-amber-800/80">
                      {aiSettingsMessage ?? 'Enable AI in Settings to use your local model.'}
                    </p>
                  </div>
                </div>
              )}

              {aiError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {aiError}
                </div>
              )}

              <div className="space-y-3 max-h-72 overflow-auto">
                {aiRuns.map((run) => (
                  <article key={run.id} className="rounded-xl border border-muted-foreground/20 bg-background/60 p-3 shadow-xs">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary" className="uppercase tracking-wide text-[10px]">
                        {ACTION_LABELS[run.type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(run.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                      {run.result}
                    </pre>
                  </article>
                ))}
                {aiRuns.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No AI results yet. Run an action above to get started.
                  </p>
                )}
              </div>
            </CardPanel>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
