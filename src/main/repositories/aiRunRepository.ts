import { getDatabase } from '../database/database';
import type { AiActionType, AiRun } from '../../shared/types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface AiRunRow {
  id: string;
  snippet_id: string;
  type: string;
  result: string;
  created_at: string;
}

export const AiRunRepository = {
  create(data: { snippetId: string; type: AiActionType; result: string }): AiRun {
    const db = getDatabase();
    const id = generateId();
    const createdAt = new Date().toISOString();

    db.prepare(
      `
        INSERT INTO ai_runs (id, snippet_id, type, result, created_at)
        VALUES (?, ?, ?, ?, ?)
      `
    ).run(id, data.snippetId, data.type, data.result, createdAt);

    return {
      id,
      snippetId: data.snippetId,
      type: data.type,
      result: data.result,
      createdAt,
    };
  },

  listForSnippet(snippetId: string): AiRun[] {
    const db = getDatabase();
    const rows = db.prepare(
      `
        SELECT id, snippet_id, type, result, created_at
        FROM ai_runs
        WHERE snippet_id = ?
        ORDER BY datetime(created_at) DESC
      `
    ).all(snippetId) as AiRunRow[];

    return rows.map((row) => ({
      id: row.id,
      snippetId: row.snippet_id,
      type: row.type as AiActionType,
      result: row.result,
      createdAt: row.created_at,
    }));
  },
};
