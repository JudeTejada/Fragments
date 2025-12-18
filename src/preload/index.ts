import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../shared/channels'
import type { CreateSnippetPayload, UpdateSnippetPayload, SearchParams, Settings, Snippet, Tag, AiRun, AiActionType } from '../shared/types'

// Response type from IPC handlers
interface IPCResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Custom APIs for renderer
const api = {
  snippets: {
    list: (tagIds?: string[]): Promise<IPCResponse<Snippet[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPETS_LIST, { tagIds }),

    get: (id: string): Promise<IPCResponse<Snippet>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPETS_GET, { id }),

    create: (data: CreateSnippetPayload): Promise<IPCResponse<Snippet>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPETS_CREATE, data),

    update: (data: UpdateSnippetPayload): Promise<IPCResponse<Snippet>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPETS_UPDATE, data),

    delete: (id: string): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPETS_DELETE, { id }),

    search: (params: SearchParams): Promise<IPCResponse<Snippet[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPETS_SEARCH, params),
  },

  tags: {
    list: (): Promise<IPCResponse<Tag[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAGS_LIST),

    create: (name: string): Promise<IPCResponse<Tag>> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAGS_CREATE, { name }),

    update: (id: string, name: string): Promise<IPCResponse<Tag>> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAGS_UPDATE, { id, name }),

    delete: (id: string): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAGS_DELETE, { id }),
  },

  settings: {
    get: (): Promise<IPCResponse<Settings>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),

    update: (settings: Partial<Settings>): Promise<IPCResponse<Settings>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings),
  },

  quickCapture: {
    onNewSnippet: (cb: (payload: { content: string }) => void) => {
      const handler = (_event: unknown, payload: { content: string }) => cb(payload);
      ipcRenderer.on('quick-capture:new-snippet', handler);
      return () => ipcRenderer.removeListener('quick-capture:new-snippet', handler);
    },
    onError: (cb: (payload: { message: string }) => void) => {
      const handler = (_event: unknown, payload: { message: string }) => cb(payload);
      ipcRenderer.on('quick-capture:error', handler);
      return () => ipcRenderer.removeListener('quick-capture:error', handler);
    },
    onShortcutError: (cb: (payload: { shortcut: string; message: string }) => void) => {
      const handler = (_event: unknown, payload: { shortcut: string; message: string }) => cb(payload);
      ipcRenderer.on('quick-capture:shortcut-error', handler);
      return () => ipcRenderer.removeListener('quick-capture:shortcut-error', handler);
    },
  },

  backup: {
    export: (): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke(IPC_CHANNELS.BACKUP_EXPORT),
  },

  system: {
    getDbPath: (): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DB_PATH),
  },

  ai: {
    run: (data: { snippetId: string; type: AiActionType }): Promise<IPCResponse<AiRun>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AI_RUN, data),
    listForSnippet: (snippetId: string): Promise<IPCResponse<AiRun[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AI_LIST_FOR_SNIPPET, { snippetId }),
    testConnection: (): Promise<IPCResponse<{ ok: boolean; message?: string; models?: string[] }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AI_TEST_CONNECTION),
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
