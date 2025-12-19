// Snippet Repository - handles all snippet-related database operations
import { getDatabase } from '../database/database'
import type {
  Snippet,
  Tag,
  CreateSnippetPayload,
  UpdateSnippetPayload,
  SearchParams
} from '../../shared/types'
import { TagRepository } from './tagRepository'

// Generate a simple UUID v4
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Row type from database
interface SnippetRow {
  id: string
  title: string
  language: string
  content: string
  notes: string | null
  is_favorite: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface TagRow {
  id: string
  name: string
}

export const SnippetRepository = {
  /**
   * List all snippets, optionally filtered by tag IDs
   * Returns snippets ordered by updated_at descending
   */
  list(tagIds?: string[]): Snippet[] {
    const db = getDatabase()

    let snippetRows: SnippetRow[]

    if (tagIds && tagIds.length > 0) {
      // Filter by tags using a subquery
      const placeholders = tagIds.map(() => '?').join(',')
      snippetRows = db
        .prepare(
          `
        SELECT DISTINCT s.*
        FROM snippets s
        INNER JOIN snippet_tags st ON s.id = st.snippet_id
        WHERE st.tag_id IN (${placeholders})
        AND s.deleted_at IS NULL
        ORDER BY s.updated_at DESC
      `
        )
        .all(...tagIds) as SnippetRow[]
    } else {
      snippetRows = db
        .prepare(
          `
        SELECT * FROM snippets
        WHERE deleted_at IS NULL
        ORDER BY updated_at DESC
      `
        )
        .all() as SnippetRow[]
    }

    // Get tags for each snippet
    return snippetRows.map((row) => ({
      id: row.id,
      title: row.title,
      language: row.language,
      content: row.content,
      notes: row.notes,
      isFavorite: Boolean(row.is_favorite),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      tags: SnippetRepository.getTagsForSnippet(row.id)
    }))
  },

  /**
   * Get a single snippet by ID with all its tags
   */
  get(id: string): Snippet | null {
    const db = getDatabase()

    const row = db
      .prepare(
        `
      SELECT * FROM snippets WHERE id = ?
    `
      )
      .get(id) as SnippetRow | undefined

    if (!row) {
      return null
    }

    return {
      id: row.id,
      title: row.title,
      language: row.language,
      content: row.content,
      notes: row.notes,
      isFavorite: Boolean(row.is_favorite),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      tags: SnippetRepository.getTagsForSnippet(row.id)
    }
  },

  /**
   * Create a new snippet with tags
   */
  create(data: CreateSnippetPayload): Snippet {
    const db = getDatabase()
    const id = generateId()
    const now = new Date().toISOString()

    // Use a transaction to ensure atomicity
    const transaction = db.transaction(() => {
      // Insert the snippet
      db.prepare(
        `
        INSERT INTO snippets (id, title, language, content, notes, is_favorite, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        id,
        data.title,
        data.language,
        data.content,
        data.notes ?? null,
        data.isFavorite ? 1 : 0,
        now,
        now
      )

      // Handle tags
      if (data.tags && data.tags.length > 0) {
        const tags = TagRepository.findOrCreateMany(data.tags)
        const insertTagLink = db.prepare(`
          INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)
        `)

        for (const tag of tags) {
          insertTagLink.run(id, tag.id)
        }
      }
    })

    transaction()

    return SnippetRepository.get(id)!
  },

  /**
   * Update an existing snippet
   */
  update(id: string, data: UpdateSnippetPayload): Snippet | null {
    const db = getDatabase()
    const existing = SnippetRepository.get(id)

    if (!existing) {
      return null
    }

    const now = new Date().toISOString()

    const transaction = db.transaction(() => {
      // Update snippet fields
      db.prepare(
        `
        UPDATE snippets
        SET title = ?, language = ?, content = ?, notes = ?, is_favorite = ?, updated_at = ?
        WHERE id = ?
      `
      ).run(
        data.title ?? existing.title,
        data.language ?? existing.language,
        data.content ?? existing.content,
        data.notes ?? existing.notes,
        data.isFavorite !== undefined ? (data.isFavorite ? 1 : 0) : existing.isFavorite ? 1 : 0,
        now,
        id
      )

      // Re-sync tags if provided
      if (data.tags !== undefined) {
        // Delete existing tag links
        db.prepare('DELETE FROM snippet_tags WHERE snippet_id = ?').run(id)

        // Add new tag links
        if (data.tags.length > 0) {
          const tags = TagRepository.findOrCreateMany(data.tags)
          const insertTagLink = db.prepare(`
            INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)
          `)

          for (const tag of tags) {
            insertTagLink.run(id, tag.id)
          }
        }
      }
    })

    transaction()

    return SnippetRepository.get(id)
  },

  /**
   * Delete a snippet and its tag associations
   */
  delete(id: string): boolean {
    const db = getDatabase()

    const transaction = db.transaction(() => {
      // Delete tag associations first (handled by CASCADE but being explicit)
      db.prepare('DELETE FROM snippet_tags WHERE snippet_id = ?').run(id)

      // Delete the snippet
      const result = db.prepare('DELETE FROM snippets WHERE id = ?').run(id)
      return result.changes > 0
    })

    return transaction()
  },

  /**
   * Search snippets by query string and optionally filter by tags
   * Searches in title, content, and notes
   */
  search(params: SearchParams): Snippet[] {
    const db = getDatabase()
    const { query, tagIds } = params

    if (!query && (!tagIds || tagIds.length === 0)) {
      return SnippetRepository.list()
    }

    let sql = 'SELECT DISTINCT s.* FROM snippets s'
    const conditions: string[] = []
    const bindings: (string | number)[] = []

    // Join with tags if filtering by tagIds
    if (tagIds && tagIds.length > 0) {
      sql += ' INNER JOIN snippet_tags st ON s.id = st.snippet_id'
      const placeholders = tagIds.map(() => '?').join(',')
      conditions.push(`st.tag_id IN (${placeholders})`)
      conditions.push('s.deleted_at IS NULL')
      bindings.push(...tagIds)
    } else {
      // Add deleted_at filter when not filtering by tags
      conditions.push('s.deleted_at IS NULL')
    }

    // Add search condition
    if (query) {
      const searchPattern = `%${query}%`
      conditions.push('(s.title LIKE ? OR s.content LIKE ? OR s.notes LIKE ?)')
      bindings.push(searchPattern, searchPattern, searchPattern)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY s.updated_at DESC'

    const snippetRows = db.prepare(sql).all(...bindings) as SnippetRow[]

    return snippetRows.map((row) => ({
      id: row.id,
      title: row.title,
      language: row.language,
      content: row.content,
      notes: row.notes,
      isFavorite: Boolean(row.is_favorite),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      tags: SnippetRepository.getTagsForSnippet(row.id)
    }))
  },

  /**
   * Get all tags associated with a snippet
   */
  getTagsForSnippet(snippetId: string): Tag[] {
    const db = getDatabase()

    const rows = db
      .prepare(
        `
      SELECT t.id, t.name
      FROM tags t
      INNER JOIN snippet_tags st ON t.id = st.tag_id
      WHERE st.snippet_id = ?
      ORDER BY t.name
    `
      )
      .all(snippetId) as TagRow[]

    return rows.map((row) => ({
      id: row.id,
      name: row.name
    }))
  },

  /**
   * Move snippet to trash (soft delete)
   */
  softDelete(id: string): boolean {
    const db = getDatabase()
    const now = new Date().toISOString()

    const result = db
      .prepare(
        `
      UPDATE snippets 
      SET deleted_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `
      )
      .run(now, id)

    return result.changes > 0
  },

  /**
   * Restore snippet from trash
   */
  restoreFromTrash(id: string): boolean {
    const db = getDatabase()

    const result = db
      .prepare(
        `
      UPDATE snippets 
      SET deleted_at = NULL
      WHERE id = ? AND deleted_at IS NOT NULL
    `
      )
      .run(id)

    return result.changes > 0
  },

  /**
   * Permanently delete snippet from database
   */
  permanentDelete(id: string): boolean {
    const db = getDatabase()

    const transaction = db.transaction(() => {
      // Delete tag associations first (handled by CASCADE but being explicit)
      db.prepare('DELETE FROM snippet_tags WHERE snippet_id = ?').run(id)

      // Delete the snippet
      const result = db.prepare('DELETE FROM snippets WHERE id = ?').run(id)
      return result.changes > 0
    })

    return transaction()
  },

  /**
   * Get all trashed snippets with deletion info
   */
  getTrashItems(
    retentionDays: number = 30
  ): Array<Snippet & { daysSinceDeleted: number; daysUntilDeletion: number }> {
    const db = getDatabase()

    const rows = db
      .prepare(
        `
      SELECT * FROM snippets
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `
      )
      .all() as SnippetRow[]

    const now = new Date()

    return rows.map((row) => {
      const deletedAt = new Date(row.deleted_at!)
      const daysSinceDeleted = Math.floor(
        (now.getTime() - deletedAt.getTime()) / (24 * 60 * 60 * 1000)
      )
      const daysUntilDeletion = Math.max(0, retentionDays - daysSinceDeleted)

      return {
        id: row.id,
        title: row.title,
        language: row.language,
        content: row.content,
        notes: row.notes,
        isFavorite: Boolean(row.is_favorite),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at!,
        tags: SnippetRepository.getTagsForSnippet(row.id),
        daysSinceDeleted,
        daysUntilDeletion
      }
    })
  },

  /**
   * Empty trash by permanently deleting all trashed items
   */
  emptyTrash(): number {
    const db = getDatabase()

    // First get all trashed snippet IDs to clean up tag associations
    const trashedIds = db.prepare('SELECT id FROM snippets WHERE deleted_at IS NOT NULL').all() as {
      id: string
    }[]

    if (trashedIds.length === 0) {
      return 0
    }

    const transaction = db.transaction(() => {
      // Delete all tag associations for trashed snippets
      const placeholders = trashedIds.map(() => '?').join(',')
      db.prepare(`DELETE FROM snippet_tags WHERE snippet_id IN (${placeholders})`).run(
        ...trashedIds.map((item) => item.id)
      )

      // Delete all trashed snippets
      const result = db.prepare('DELETE FROM snippets WHERE deleted_at IS NOT NULL').run()
      return result.changes
    })

    return transaction()
  }
}
