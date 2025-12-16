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

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',

  // Backup & System
  BACKUP_EXPORT: 'backup:export',
  DB_PATH: 'db:path',
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
