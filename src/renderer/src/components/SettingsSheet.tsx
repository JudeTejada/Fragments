import * as React from 'react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetPanel,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Database, Download, Loader2, Check, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SettingsSheet() {
  const [dbPath, setDbPath] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportResult, setExportResult] = React.useState<{ success: boolean; message: string } | null>(null);

  // Load DB path on open
  const handleOpenChange = async (open: boolean) => {
    if (open) {
      setIsLoading(true);
      setExportResult(null);
      try {
        const result = await window.api.system.getDbPath();
        if (result.success && result.data) {
          setDbPath(result.data);
        }
      } catch (err) {
        console.error('Failed to get DB path:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Export database
  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);
    try {
      const result = await window.api.backup.export();
      if (result.success && result.data) {
        setExportResult({
          success: true,
          message: `Exported to: ${result.data}`,
        });
      } else if (result.error === 'Export canceled') {
        // User canceled, no message needed
        setExportResult(null);
      } else {
        setExportResult({
          success: false,
          message: result.error || 'Export failed',
        });
      }
    } catch (err) {
      setExportResult({
        success: false,
        message: String(err),
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="size-7 rounded-lg" />}
      >
        <Settings className="size-4" />
        <span className="sr-only">Settings</span>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure your Code Snippets application
          </SheetDescription>
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
                        const folderPath = dbPath.substring(0, dbPath.lastIndexOf('/'));
                        window.electron.ipcRenderer.send('shell:openPath', folderPath);
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
                <Label className="text-xs text-muted-foreground">
                  Export Library
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="size-4 mr-2" />
                    )}
                    Export Backup
                  </Button>
                </div>
                {exportResult && (
                  <p className={cn(
                    "text-xs",
                    exportResult.success ? "text-green-600" : "text-destructive"
                  )}>
                    {exportResult.success && <Check className="size-3 inline mr-1" />}
                    {exportResult.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  Creates a backup of your entire snippet library.
                </p>
              </div>
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
  );
}
