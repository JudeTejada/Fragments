// Database migrations for Code Snippets

export const MIGRATIONS = [
  // Version 1: Initial schema
  {
    version: 1,
    up: `
      -- Snippets table
      CREATE TABLE IF NOT EXISTS snippets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Tags table
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );

      -- Snippet-Tags junction table
      CREATE TABLE IF NOT EXISTS snippet_tags (
        snippet_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (snippet_id, tag_id),
        FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      -- Settings table
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      -- Schema version tracking
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_snippets_updated_at ON snippets(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
    `
  },

  // Version 2: AI runs table and AI settings defaults
  {
    version: 2,
    up: `
      CREATE TABLE IF NOT EXISTS ai_runs (
        id TEXT PRIMARY KEY,
        snippet_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('explain', 'comment', 'usage_example')),
        result TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_ai_runs_snippet_id ON ai_runs(snippet_id);

      INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_backend', '"none"');
    `
  },

  // Version 3: Favorites support for snippets
  {
    version: 3,
    up: `
      ALTER TABLE snippets ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_snippets_is_favorite ON snippets(is_favorite);
      UPDATE snippets SET is_favorite = 0 WHERE is_favorite IS NULL;
    `
  }
];
