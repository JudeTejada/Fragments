import * as React from 'react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetPanel,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Settings,
  Database,
  Download,
  Loader2,
  Check,
  FolderOpen,
  Sparkles,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AiBackend } from '@shared/types'
import { ShortcutInput } from '@/components/ShortcutInput'

type SettingsUpdate = Partial<{
  ai_backend: AiBackend
  ollama_model_name: string
  quick_capture_shortcut: string
  trash_retention_days: number
}>

export function SettingsSheet() {
  const [dbPath, setDbPath] = React.useState<string>('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [exportResult, setExportResult] = React.useState<{
    success: boolean
    message: string
  } | null>(null)
  const [aiBackend, setAiBackend] = React.useState<AiBackend>('none')
  const [ollamaModel, setOllamaModel] = React.useState('')
  const [isSavingSettings, setIsSavingSettings] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ ok: boolean; message?: string } | null>(null)
  const [models, setModels] = React.useState<string[]>([])
  const [quickCaptureShortcut, setQuickCaptureShortcut] = React.useState('')
  const [trashRetentionDays, setTrashRetentionDays] = React.useState(30)

  const loadSettings = React.useCallback(async () => {
    try {
      const result = await window.api.settings.get()
      if (result.success && result.data) {
        const backend = (result.data.ai_backend ?? 'none') as AiBackend
        const model = result.data.ollama_model_name ?? ''
        const shortcut = result.data.quick_capture_shortcut ?? ''
        const retentionDays = result.data.trash_retention_days ?? 30
        setAiBackend(backend)
        setOllamaModel(model)
        setQuickCaptureShortcut(shortcut)
        setTrashRetentionDays(retentionDays)
        return { backend, model, shortcut, retentionDays }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
    return null
  }, [])

  const saveSettings = React.useCallback(async (partial: SettingsUpdate) => {
    setIsSavingSettings(true)
    try {
      const result = await window.api.settings.update(partial)
      if (result.success && result.data) {
        setAiBackend((result.data.ai_backend ?? 'none') as AiBackend)
        setOllamaModel(result.data.ollama_model_name ?? '')
        if (result.data.quick_capture_shortcut !== undefined) {
          setQuickCaptureShortcut(result.data.quick_capture_shortcut)
        }
      }
    } catch (err) {
      console.error('Failed to update settings:', err)
    } finally {
      setIsSavingSettings(false)
    }
  }, [])

  const fetchModels = React.useCallback(
    async (backendOverride?: AiBackend) => {
      const backend = backendOverride ?? aiBackend
      if (backend !== 'ollama') {
        setModels([])
        return
      }
      setIsTesting(true)
      setTestResult(null)
      try {
        const result = await window.api.ai.testConnection()
        if (result.success && result.data) {
          const detected = result.data.models ?? []
          setModels(detected)
          if (detected.length > 0 && !ollamaModel) {
            setOllamaModel(detected[0])
            await saveSettings({ ollama_model_name: detected[0] })
          }
          setTestResult({ ok: result.data.ok, message: result.data.message })
        } else {
          setModels([])
          setTestResult({ ok: false, message: result.error || 'Failed to test connection' })
        }
      } catch (err) {
        setModels([])
        setTestResult({
          ok: false,
          message: err instanceof Error ? err.message : 'Failed to test connection'
        })
      } finally {
        setIsTesting(false)
      }
    },
    [aiBackend, ollamaModel, saveSettings]
  )

  // Load DB path on open
  const handleOpenChange = async (open: boolean) => {
    if (open) {
      setIsLoading(true)
      setExportResult(null)
      setTestResult(null)
      try {
        const [dbResult, settings] = await Promise.all([
          window.api.system.getDbPath(),
          loadSettings()
        ])
        if (dbResult.success && dbResult.data) {
          setDbPath(dbResult.data)
        }
        if (settings?.backend === 'ollama') {
          await fetchModels(settings.backend)
        } else {
          setModels([])
        }
      } catch (err) {
        console.error('Failed to get DB path:', err)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Export database
  const handleExport = async () => {
    setIsExporting(true)
    setExportResult(null)
    try {
      const result = await window.api.backup.export()
      if (result.success && result.data) {
        setExportResult({
          success: true,
          message: `Exported to: ${result.data}`
        })
      } else if (result.error === 'Export canceled') {
        // User canceled, no message needed
        setExportResult(null)
      } else {
        setExportResult({
          success: false,
          message: result.error || 'Export failed'
        })
      }
    } catch (err) {
      setExportResult({
        success: false,
        message: String(err)
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleBackendChange = async (value: string | null) => {
    if (!value) return
    const backend = value as AiBackend
    setAiBackend(backend)
    setTestResult(null)
    await saveSettings({ ai_backend: backend })
    await fetchModels(backend)
  }

  const handleModelBlur = async () => {
    setTestResult(null)
    await saveSettings({ ollama_model_name: ollamaModel.trim() })
  }

  const handleTestConnection = async () => {
    if (aiBackend === 'ollama') {
      await saveSettings({ ollama_model_name: ollamaModel.trim() })
    }
    await fetchModels()
  }

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="size-7 rounded-lg" />}>
        <Settings className="size-4" />
        <span className="sr-only">Settings</span>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Configure your Code Snippets application</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <div className="space-y-6">
            {/* Data Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Database className="size-4" />
                Data
              </h3>

              {/* Database Location */}
              <div className="space-y-2">
                <Label htmlFor="db-path" className="text-xs text-muted-foreground">
                  Database Location
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="db-path"
                    value={isLoading ? 'Loading...' : dbPath}
                    readOnly
                    className="text-xs font-mono bg-muted/50"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      // Open folder in Finder/Explorer
                      if (dbPath) {
                        const folderPath = dbPath.substring(0, dbPath.lastIndexOf('/'))
                        window.electron.ipcRenderer.send('shell:openPath', folderPath)
                      }
                    }}
                    disabled={!dbPath}
                  >
                    <FolderOpen className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Your snippets are stored locally on your device.
                </p>
              </div>

              {/* Export Library */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Export Library</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="size-4 mr-2" />
                    )}
                    Export Backup
                  </Button>
                </div>
                {exportResult && (
                  <p
                    className={cn(
                      'text-xs',
                      exportResult.success ? 'text-green-600' : 'text-destructive'
                    )}
                  >
                    {exportResult.success && <Check className="size-3 inline mr-1" />}
                    {exportResult.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  Creates a backup of your entire snippet library.
                </p>
              </div>
            </div>

            {/* Quick Capture */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="size-4" />
                Quick capture
              </h3>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Global shortcut</Label>
                <ShortcutInput
                  value={quickCaptureShortcut}
                  onChange={(value) => {
                    setQuickCaptureShortcut(value)
                    void saveSettings({ quick_capture_shortcut: value })
                  }}
                />
                <p className="text-xs text-muted-foreground/70">
                  Use this shortcut to pull clipboard text into a new snippet without leaving your
                  current app.
                </p>
              </div>
            </div>

            {/* Trash & Recovery Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Trash2 className="size-4" />
                Trash & Recovery
              </h3>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Retention period (days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={trashRetentionDays}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 30
                    setTrashRetentionDays(value)
                    void saveSettings({ trash_retention_days: value })
                  }}
                  className="w-20 text-sm"
                />
                <p className="text-xs text-muted-foreground/70">
                  Deleted snippets are kept in trash for recovery. They will be permanently deleted
                  after this many days.
                </p>
              </div>
            </div>

            {/* AI Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="size-4" />
                AI
              </h3>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">AI Backend</Label>
                <Select value={aiBackend} onValueChange={handleBackendChange}>
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ollama">Ollama (local)</SelectItem>
                  </SelectPopup>
                </Select>
                <p className="text-xs text-muted-foreground/70">
                  Use your local Ollama server at http://localhost:11434. No cloud models are used.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground" htmlFor="ollama-model">
                  Ollama model
                </Label>
                {models.length > 0 ? (
                  <Select
                    value={ollamaModel || models[0]}
                    onValueChange={async (value) => {
                      if (!value) return
                      setOllamaModel(value)
                      setTestResult(null)
                      await saveSettings({ ollama_model_name: value })
                    }}
                    disabled={aiBackend !== 'ollama'}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                ) : (
                  <Input
                    id="ollama-model"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    onBlur={handleModelBlur}
                    placeholder="e.g. qwen2.5-coder"
                    disabled={aiBackend !== 'ollama'}
                    className="text-sm"
                  />
                )}
                <p className="text-xs text-muted-foreground/70">
                  Detected models are listed automatically. If none appear, type a model name
                  installed in Ollama.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={aiBackend !== 'ollama' || isTesting || isSavingSettings}
                >
                  {isTesting ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="size-4 mr-2" />
                  )}
                  Refresh models
                </Button>
                {isSavingSettings && <span className="text-xs text-muted-foreground">Saving…</span>}
                {testResult && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      testResult.ok ? 'text-green-600' : 'text-destructive'
                    )}
                  >
                    {testResult.ok ? 'Connected' : 'Unable to connect'}
                  </span>
                )}
              </div>
              {testResult?.message && (
                <p className={cn('text-xs', testResult.ok ? 'text-green-700' : 'text-destructive')}>
                  {testResult.message}
                </p>
              )}
            </div>

            {/* About Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-foreground">About</h3>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Code Snippets</span> v1.0.0
                </p>
                <p className="text-xs text-muted-foreground/70">
                  A beautiful, local-first code snippet manager.
                </p>
              </div>
            </div>
          </div>
        </SheetPanel>

        <SheetFooter variant="bare">
          <p className="text-xs text-muted-foreground/50 text-center w-full">
            All data stays on your device
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
