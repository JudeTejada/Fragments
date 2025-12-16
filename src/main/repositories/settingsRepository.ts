// Settings Repository - handles application settings
import { getDatabase } from '../database/database';
import type { Settings } from '../../shared/types';

interface SettingRow {
  key: string;
  value: string | null;
}

export const SettingsRepository = {
  /**
   * Get all settings as an object
   */
  getAll(): Settings {
    const db = getDatabase();

    const rows = db.prepare('SELECT key, value FROM settings').all() as SettingRow[];

    const settings: Settings = {};

    for (const row of rows) {
      try {
        // Try to parse JSON values
        settings[row.key as keyof Settings] = row.value ? JSON.parse(row.value) : undefined;
      } catch {
        // If not valid JSON, use as string
        settings[row.key as keyof Settings] = row.value as any;
      }
    }

    return settings;
  },

  /**
   * Update settings (merge with existing)
   */
  update(partial: Partial<Settings>): Settings {
    const db = getDatabase();

    const upsert = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(partial)) {
        const serialized = value !== undefined ? JSON.stringify(value) : null;
        upsert.run(key, serialized);
      }
    });

    transaction();

    return SettingsRepository.getAll();
  },

  /**
   * Get a single setting value
   */
  get<K extends keyof Settings>(key: K): Settings[K] | undefined {
    const db = getDatabase();

    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string | null } | undefined;

    if (!row || row.value === null) {
      return undefined;
    }

    try {
      return JSON.parse(row.value);
    } catch {
      return row.value as Settings[K];
    }
  },

  /**
   * Set a single setting value
   */
  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    const db = getDatabase();

    const serialized = value !== undefined ? JSON.stringify(value) : null;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, serialized);
  },
};
