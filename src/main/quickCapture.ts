import { globalShortcut, clipboard, BrowserWindow } from 'electron';
import { getEffectiveSettings } from './settingsService';

let currentShortcut: string | null = null;

function getMainWindow(): BrowserWindow | undefined {
  const [win] = BrowserWindow.getAllWindows();
  return win;
}

export function handleQuickCapture() {
  const text = clipboard.readText().trim();
  const win = getMainWindow();

  if (!text) {
    win?.webContents.send('quick-capture:error', {
      message: 'Clipboard is empty or has no text.',
    });
    return;
  }

  if (win?.isMinimized()) {
    win.restore();
  }
  win?.show();
  win?.focus();

  win?.webContents.send('quick-capture:new-snippet', { content: text });
}

export function registerQuickCaptureShortcut() {
  const { quick_capture_shortcut } = getEffectiveSettings();

  if (currentShortcut) {
    globalShortcut.unregister(currentShortcut);
    currentShortcut = null;
  }

  if (!quick_capture_shortcut) return;

  const ok = globalShortcut.register(quick_capture_shortcut, () => {
    handleQuickCapture();
  });

  if (!ok) {
    const win = getMainWindow();
    win?.webContents.send('quick-capture:shortcut-error', {
      shortcut: quick_capture_shortcut,
      message: 'Failed to register global shortcut. Try a different combination.',
    });
    return;
  }

  currentShortcut = quick_capture_shortcut;
}

export function unregisterAllShortcuts() {
  globalShortcut.unregisterAll();
  currentShortcut = null;
}
