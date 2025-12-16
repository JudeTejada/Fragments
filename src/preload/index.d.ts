import { ElectronAPI } from '@electron-toolkit/preload'
import type { Snippet, Tag, Settings, CreateSnippetPayload, UpdateSnippetPayload, SearchParams, AiRun, AiActionType } from '../shared/types'

// Response type from IPC handlers
interface IPCResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// API interface exposed to renderer
interface CodeSnippetsAPI {
  snippets: {
    list: (tagIds?: string[]) => Promise<IPCResponse<Snippet[]>>
    get: (id: string) => Promise<IPCResponse<Snippet>>
    create: (data: CreateSnippetPayload) => Promise<IPCResponse<Snippet>>
    update: (data: UpdateSnippetPayload) => Promise<IPCResponse<Snippet>>
    delete: (id: string) => Promise<IPCResponse<boolean>>
    search: (params: SearchParams) => Promise<IPCResponse<Snippet[]>>
  }
  tags: {
    list: () => Promise<IPCResponse<Tag[]>>
  }
  settings: {
    get: () => Promise<IPCResponse<Settings>>
    update: (settings: Partial<Settings>) => Promise<IPCResponse<Settings>>
  }
  backup: {
    export: () => Promise<IPCResponse<string>>
  }
  system: {
    getDbPath: () => Promise<IPCResponse<string>>
  }
  ai: {
    run: (data: { snippetId: string; type: AiActionType }) => Promise<IPCResponse<AiRun>>
    listForSnippet: (snippetId: string) => Promise<IPCResponse<AiRun[]>>
    testConnection: () => Promise<IPCResponse<{ ok: boolean; message?: string; models?: string[] }>>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CodeSnippetsAPI
  }
}

export type { IPCResponse, CodeSnippetsAPI }
