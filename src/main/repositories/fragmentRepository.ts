// Fragment Repository - handles all fragment-related database operations
import { getDatabase } from '../database/database'
import type { Fragment, CreateFragmentPayload, UpdateFragmentPayload } from '../../shared/types'

interface FragmentRow {
  id: string
  snippet_id: string
  name: string
  language: string
  content: string
  sort_order: number
  created_at: string
  updated_at: string
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function rowToFragment(row: FragmentRow): Fragment {
  return {
    id: row.id,
    snippetId: row.snippet_id,
    name: row.name,
    language: row.language,
    content: row.content,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const FragmentRepository = {
  /**
   * List all fragments for a snippet ordered by sortOrder
   */
  listForSnippet(snippetId: string): Fragment[] {
    const db = getDatabase()
    const rows = db
      .prepare(
        `
      SELECT * FROM fragments
      WHERE snippet_id = ?
      ORDER BY sort_order ASC
    `
      )
      .all(snippetId) as FragmentRow[]
    return rows.map(rowToFragment)
  },

  /**
   * Get a single fragment by ID
   */
  get(id: string): Fragment | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM fragments WHERE id = ?').get(id) as
      | FragmentRow
      | undefined
    return row ? rowToFragment(row) : null
  },

  /**
   * Create a new fragment
   */
  create(data: CreateFragmentPayload): Fragment {
    const db = getDatabase()
    const id = generateId()
    const now = new Date().toISOString()

    // Get next sort order
    const maxOrder = db
      .prepare(
        `
      SELECT COALESCE(MAX(sort_order), -1) as max_order
      FROM fragments WHERE snippet_id = ?
    `
      )
      .get(data.snippetId) as { max_order: number }

    db.prepare(
      `
      INSERT INTO fragments (id, snippet_id, name, language, content, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      data.snippetId,
      data.name ?? `Fragment ${maxOrder.max_order + 2}`,
      data.language,
      data.content ?? '',
      maxOrder.max_order + 1,
      now,
      now
    )

    return FragmentRepository.get(id)!
  },

  /**
   * Update an existing fragment
   */
  update(id: string, data: UpdateFragmentPayload): Fragment | null {
    const db = getDatabase()
    const existing = FragmentRepository.get(id)
    if (!existing) return null

    const now = new Date().toISOString()
    db.prepare(
      `
      UPDATE fragments
      SET name = ?, language = ?, content = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `
    ).run(
      data.name ?? existing.name,
      data.language ?? existing.language,
      data.content ?? existing.content,
      data.sortOrder ?? existing.sortOrder,
      now,
      id
    )

    return FragmentRepository.get(id)
  },

  /**
   * Delete a fragment (cannot delete last fragment)
   */
  delete(id: string): boolean {
    const db = getDatabase()

    // Get snippet_id before delete for reordering
    const fragment = FragmentRepository.get(id)
    if (!fragment) return false

    // Don't allow deleting the last fragment
    const count = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM fragments WHERE snippet_id = ?
    `
      )
      .get(fragment.snippetId) as { count: number }

    if (count.count <= 1) {
      throw new Error('Cannot delete the last fragment of a snippet')
    }

    const result = db.prepare('DELETE FROM fragments WHERE id = ?').run(id)

    // Reorder remaining fragments to maintain sequential order
    if (result.changes > 0) {
      const remaining = db
        .prepare(
          `
        SELECT id FROM fragments
        WHERE snippet_id = ?
        ORDER BY sort_order ASC
      `
        )
        .all(fragment.snippetId) as { id: string }[]

      const updateStmt = db.prepare('UPDATE fragments SET sort_order = ? WHERE id = ?')
      remaining.forEach((row, index) => {
        updateStmt.run(index, row.id)
      })
    }

    return result.changes > 0
  },

  /**
   * Reorder fragments in a snippet
   */
  reorder(snippetId: string, fragmentIds: string[]): void {
    const db = getDatabase()
    const now = new Date().toISOString()

    const stmt = db.prepare(`
      UPDATE fragments SET sort_order = ?, updated_at = ? WHERE id = ? AND snippet_id = ?
    `)

    db.transaction(() => {
      fragmentIds.forEach((id, index) => {
        stmt.run(index, now, id, snippetId)
      })
    })()
  },

  /**
   * Create initial fragment for a new snippet
   */
  createInitial(snippetId: string, language: string, content: string): Fragment {
    return FragmentRepository.create({
      snippetId,
      name: 'main',
      language,
      content
    })
  }
}
