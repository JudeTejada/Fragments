import type { AiActionType, AiRun, CreateSnippetPayload, SearchParams, Settings, Snippet, Tag, UpdateSnippetPayload } from '@shared/types';

type IPCResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type ElectronAPI = typeof import('@electron-toolkit/preload').electronAPI;

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      snippets: {
        list: (tagIds?: string[]) => Promise<IPCResponse<Snippet[]>>;
        get: (id: string) => Promise<IPCResponse<Snippet>>;
        create: (data: CreateSnippetPayload) => Promise<IPCResponse<Snippet>>;
        update: (data: UpdateSnippetPayload) => Promise<IPCResponse<Snippet>>;
        delete: (id: string) => Promise<IPCResponse<boolean>>;
        search: (params: SearchParams) => Promise<IPCResponse<Snippet[]>>;
      };
      tags: {
        list: () => Promise<IPCResponse<Tag[]>>;
      };
      settings: {
        get: () => Promise<IPCResponse<Settings>>;
        update: (partial: Partial<Settings>) => Promise<IPCResponse<Settings>>;
      };
      quickCapture: {
        onNewSnippet: (cb: (payload: { content: string }) => void) => () => void;
        onError: (cb: (payload: { message: string }) => void) => () => void;
        onShortcutError: (cb: (payload: { shortcut: string; message: string }) => void) => () => void;
      };
      backup: {
        export: () => Promise<IPCResponse<string>>;
      };
      system: {
        getDbPath: () => Promise<IPCResponse<string>>;
      };
      ai: {
        run: (data: { snippetId: string; type: AiActionType }) => Promise<IPCResponse<AiRun>>;
        listForSnippet: (snippetId: string) => Promise<IPCResponse<AiRun[]>>;
        testConnection: () => Promise<IPCResponse<{ ok: boolean; message?: string; models?: string[] }>>;
      };
    };
  }
}

export {};
