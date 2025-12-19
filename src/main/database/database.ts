// Database connection and initialization for Fragment
import { app } from 'electron'
import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { MIGRATIONS } from './migrations'

let db: Database.Database | null = null

/**
 * Get the database file path based on OS
 * - macOS: ~/Library/Application Support/fragment/
 * - Windows: %APPDATA%/fragment/
 * - Linux: ~/.config/fragment/
 */
function getDatabasePath(): string {
  const userDataPath = app.getPath('userData')

  // Ensure directory exists
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }

  return join(userDataPath, 'fragment.db')
}

/**
 * Get current schema version from database
 */
function getCurrentVersion(database: Database.Database): number {
  try {
    const result = database.prepare('SELECT MAX(version) as version FROM schema_version').get() as {
      version: number | null
    }
    return result?.version ?? 0
  } catch {
    // Table doesn't exist yet
    return 0
  }
}

/**
 * Run database migrations
 */
function runMigrations(database: Database.Database): void {
  const currentVersion = getCurrentVersion(database)

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      console.log(`Running migration version ${migration.version}...`)

      // Run migration in a transaction
      database.exec(migration.up)

      // Record the migration
      database
        .prepare('INSERT OR REPLACE INTO schema_version (version) VALUES (?)')
        .run(migration.version)

      console.log(`Migration version ${migration.version} complete.`)
    }
  }
}

/**
 * Initialize the database connection
 * Creates the database file and runs migrations if needed
 */
export function initDatabase(): Database.Database {
  if (db) {
    return db
  }

  const dbPath = getDatabasePath()
  console.log(`Initializing database at: ${dbPath}`)

  // Create database connection with WAL mode for better concurrent access
  db = new Database(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Use WAL mode for better performance
  db.pragma('journal_mode = WAL')

  // Run migrations
  runMigrations(db)

  console.log('Database initialized successfully.')

  return db
}

/**
 * Get the database instance
 * Throws if database hasn't been initialized
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    console.log('Database connection closed.')
  }
}

/**
 * Get the path to the database file
 */
export function getDatabaseFilePath(): string {
  return getDatabasePath()
}
