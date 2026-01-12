---
name: sqlite-electron-expert
description: SQLite database integration with Electron apps. Use for: (1) better-sqlite3 setup in main process, (2)IPC communication between renderer and main, (3)database migrations, (4) encrypted databases with SQLCipher, (5) concurrent read access from renderer, (6) backup/restore, (7) performance optimization.
---

# SQLite + Electron Expert

## better-sqlite3 in Main Process

```ts
// src/main/db.ts
import Database from 'better-sqlite3'

const db = new Database('snippets.db')
db.pragma('journal_mode = WAL') // recommended for concurrent reads

// Expose via IPC
ipcMain.handle('db-query', async (_, sql: string, params?: unknown[]) => {
  return db.prepare(sql).all(params)
})

ipcMain.handle('db-exec', async (_, sql: string) => {
  return db.exec(sql)
})
```

## Renderer IPC Pattern

```ts
// src/renderer/lib/db.ts
export const db = {
  query: (sql: string, params?: unknown[]) =>
    window.ipc.invoke('db-query', sql, params),
  exec: (sql: string) => window.ipc.invoke('db-exec', sql),
}
```

## Migrations

```ts
// src/main/migrations.ts
const migrations = [
  `CREATE TABLE IF NOT EXISTS snippets (id TEXT PRIMARY KEY, title TEXT, content TEXT, tags TEXT, created_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, name TEXT, color TEXT)`,
]

export function runMigrations(db: Database) {
  for (const m of migrations) db.exec(m)
}
```

## Key Patterns

- Use WAL mode for concurrent renderer reads
- Prepared statements for security: `db.prepare('SELECT * FROM x WHERE id = ?')`
- Transaction for bulk operations: `db.transaction(() => { ... })()`
- Handle IPC errors gracefully
- Consider SQLCipher for encrypted storage
