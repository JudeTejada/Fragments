// Tag Repository - handles all tag-related database operations
import { getDatabase } from '../database/database';
import type { Tag } from '../../shared/types';

// Generate a simple UUID v4
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface TagRow {
  id: string;
  name: string;
}

interface TagWithCountRow extends TagRow {
  count: number;
}

export const TagRepository = {
  /**
   * List all tags with their snippet counts
   */
  list(): Tag[] {
    const db = getDatabase();

    const rows = db.prepare(`
      SELECT t.id, t.name, COUNT(st.snippet_id) as count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      GROUP BY t.id, t.name
      ORDER BY t.name
    `).all() as TagWithCountRow[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      count: row.count,
    }));
  },

  /**
   * Find or create multiple tags by name
   * Returns the tag objects (existing or newly created)
   */
  findOrCreateMany(names: string[]): Tag[] {
    const db = getDatabase();
    const result: Tag[] = [];

    // Normalize tag names (lowercase, trim)
    const normalizedNames = names.map(name => name.trim().toLowerCase()).filter(name => name.length > 0);

    if (normalizedNames.length === 0) {
      return result;
    }

    const findTag = db.prepare('SELECT id, name FROM tags WHERE LOWER(name) = ?');
    const insertTag = db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)');

    const transaction = db.transaction(() => {
      for (const name of normalizedNames) {
        // Try to find existing tag
        let row = findTag.get(name) as TagRow | undefined;

        if (!row) {
          // Create new tag with original casing from first occurrence
          const originalName = names.find(n => n.trim().toLowerCase() === name)?.trim() ?? name;
          const id = generateId();
          insertTag.run(id, originalName);
          row = { id, name: originalName };
        }

        // Avoid duplicates in result
        if (!result.find(t => t.id === row!.id)) {
          result.push({
            id: row.id,
            name: row.name,
          });
        }
      }
    });

    transaction();

    return result;
  },

  /**
   * Get a single tag by ID
   */
  get(id: string): Tag | null {
    const db = getDatabase();

    const row = db.prepare(`
      SELECT t.id, t.name, COUNT(st.snippet_id) as count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      WHERE t.id = ?
      GROUP BY t.id, t.name
    `).get(id) as TagWithCountRow | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      count: row.count,
    };
  },

  /**
   * Delete orphaned tags (tags with no snippets)
   * Returns the number of tags deleted
   */
  deleteOrphaned(): number {
    const db = getDatabase();

    const result = db.prepare(`
      DELETE FROM tags
      WHERE id NOT IN (
        SELECT DISTINCT tag_id FROM snippet_tags
      )
    `).run();

    return result.changes;
  },

  /**
   * Create a new standalone tag
   */
  create(name: string): Tag {
    const db = getDatabase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error('Tag name cannot be empty');
    }

    // Check if tag already exists (case-insensitive)
    const existing = db.prepare('SELECT id, name FROM tags WHERE LOWER(name) = LOWER(?)').get(trimmedName) as TagRow | undefined;
    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        count: 0,
      };
    }

    const id = generateId();
    db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(id, trimmedName);

    return {
      id,
      name: trimmedName,
      count: 0,
    };
  },

  /**
   * Update a tag's name
   */
  update(id: string, name: string): Tag | null {
    const db = getDatabase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error('Tag name cannot be empty');
    }

    // Check if tag exists
    const existing = this.get(id);
    if (!existing) {
      return null;
    }

    // Check if another tag with this name exists (case-insensitive)
    const duplicate = db.prepare('SELECT id FROM tags WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmedName, id) as { id: string } | undefined;
    if (duplicate) {
      throw new Error('A tag with this name already exists');
    }

    db.prepare('UPDATE tags SET name = ? WHERE id = ?').run(trimmedName, id);

    return {
      ...existing,
      name: trimmedName,
    };
  },

  /**
   * Delete a tag and remove it from all snippets
   * Note: This does NOT delete the snippets, only removes the tag association
   */
  delete(id: string): boolean {
    const db = getDatabase();

    // Check if tag exists
    const existing = this.get(id);
    if (!existing) {
      return false;
    }

    const transaction = db.transaction(() => {
      // Remove tag from all snippets
      db.prepare('DELETE FROM snippet_tags WHERE tag_id = ?').run(id);
      // Delete the tag itself
      db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    });

    transaction();
    return true;
  },
};
