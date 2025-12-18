// IPC Channel constants - shared between main and preload

export const IPC_CHANNELS = {
  // Snippets
  SNIPPETS_LIST: 'snippets:list',
  SNIPPETS_GET: 'snippets:get',
  SNIPPETS_CREATE: 'snippets:create',
  SNIPPETS_UPDATE: 'snippets:update',
  SNIPPETS_DELETE: 'snippets:delete',
  SNIPPETS_SEARCH: 'snippets:search',

  // Tags
  TAGS_LIST: 'tags:list',
  TAGS_CREATE: 'tags:create',
  TAGS_UPDATE: 'tags:update',
  TAGS_DELETE: 'tags:delete',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',

  // AI
  AI_RUN: 'ai:run',
  AI_LIST_FOR_SNIPPET: 'ai:listForSnippet',
  AI_TEST_CONNECTION: 'ai:testConnection',

  // Backup & System
  BACKUP_EXPORT: 'backup:export',
  DB_PATH: 'db:path',
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
