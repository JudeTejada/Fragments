// IPC Handlers - registers all IPC handlers for main process
import { ipcMain, dialog } from 'electron'
import { copyFileSync } from 'fs'
import { IPC_CHANNELS } from '../../shared/channels'
import { SnippetRepository } from '../repositories/snippetRepository'
import { TagRepository } from '../repositories/tagRepository'
import { SettingsRepository } from '../repositories/settingsRepository'
import { getDatabaseFilePath } from '../database/database'
import type {
  CreateSnippetPayload,
  UpdateSnippetPayload,
  SearchParams,
  Settings,
  AiActionType,
  CreateFragmentPayload,
  UpdateFragmentPayload
} from '../../shared/types'
import { FragmentRepository } from '../repositories/fragmentRepository'
import { AiService } from '../services/aiService'
import { getEffectiveSettings } from '../settingsService'
import { registerQuickCaptureShortcut } from '../quickCapture'

const aiService = new AiService()

/**
 * Register all IPC handlers for the application
 */
export function registerIPCHandlers(): void {
  // ========================================
  // Snippet Handlers
  // ========================================

  /**
   * List all snippets, optionally filtered by tag IDs
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_LIST, (_event, args?: { tagIds?: string[] }) => {
    try {
      return { success: true, data: SnippetRepository.list(args?.tagIds) }
    } catch (error) {
      console.error('Error listing snippets:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Get a single snippet by ID
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_GET, (_event, args: { id: string }) => {
    try {
      const snippet = SnippetRepository.get(args.id)
      if (!snippet) {
        return { success: false, error: 'Snippet not found' }
      }
      return { success: true, data: snippet }
    } catch (error) {
      console.error('Error getting snippet:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Create a new snippet
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_CREATE, (_event, args: CreateSnippetPayload) => {
    try {
      const snippet = SnippetRepository.create(args)
      return { success: true, data: snippet }
    } catch (error) {
      console.error('Error creating snippet:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Update an existing snippet
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_UPDATE, (_event, args: UpdateSnippetPayload) => {
    try {
      const snippet = SnippetRepository.update(args.id, args)
      if (!snippet) {
        return { success: false, error: 'Snippet not found' }
      }
      return { success: true, data: snippet }
    } catch (error) {
      console.error('Error updating snippet:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Delete a snippet
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_DELETE, (_event, args: { id: string }) => {
    try {
      const deleted = SnippetRepository.delete(args.id)
      if (!deleted) {
        return { success: false, error: 'Snippet not found' }
      }
      // Clean up orphaned tags
      TagRepository.deleteOrphaned()
      return { success: true, data: true }
    } catch (error) {
      console.error('Error deleting snippet:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Search snippets
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_SEARCH, (_event, args: SearchParams) => {
    try {
      const snippets = SnippetRepository.search(args)
      return { success: true, data: snippets }
    } catch (error) {
      console.error('Error searching snippets:', error)
      return { success: false, error: String(error) }
    }
  })

  // ========================================
  // Trash Handlers
  // ========================================

  /**
   * Move snippet to trash (soft delete)
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_SOFT_DELETE, (_event, args: { id: string }) => {
    try {
      const moved = SnippetRepository.softDelete(args.id)
      if (!moved) {
        return { success: false, error: 'Snippet not found or already deleted' }
      }
      return { success: true, data: true }
    } catch (error) {
      console.error('Error moving snippet to trash:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Restore snippet from trash
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_RESTORE, (_event, args: { id: string }) => {
    try {
      const restored = SnippetRepository.restoreFromTrash(args.id)
      if (!restored) {
        return { success: false, error: 'Snippet not found in trash' }
      }
      return { success: true, data: true }
    } catch (error) {
      console.error('Error restoring snippet from trash:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Permanently delete snippet
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_PERMANENT_DELETE, (_event, args: { id: string }) => {
    try {
      const deleted = SnippetRepository.permanentDelete(args.id)
      if (!deleted) {
        return { success: false, error: 'Snippet not found' }
      }
      return { success: true, data: true }
    } catch (error) {
      console.error('Error permanently deleting snippet:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Get all trashed snippets
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_GET_TRASH, (_event, args?: { retentionDays?: number }) => {
    try {
      const retentionDays = args?.retentionDays || 30
      const trashItems = SnippetRepository.getTrashItems(retentionDays)
      return { success: true, data: trashItems }
    } catch (error) {
      console.error('Error getting trash items:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Empty trash (permanently delete all trashed items)
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_EMPTY_TRASH, () => {
    try {
      const deletedCount = SnippetRepository.emptyTrash()
      return { success: true, data: deletedCount }
    } catch (error) {
      console.error('Error emptying trash:', error)
      return { success: false, error: String(error) }
    }
  })

  // ========================================
  // Tag Handlers
  // ========================================

  /**
   * List all tags with snippet counts
   */
  ipcMain.handle(IPC_CHANNELS.TAGS_LIST, () => {
    try {
      return { success: true, data: TagRepository.list() }
    } catch (error) {
      console.error('Error listing tags:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Create a new tag
   */
  ipcMain.handle(IPC_CHANNELS.TAGS_CREATE, (_event, args: { name: string }) => {
    try {
      const tag = TagRepository.create(args.name)
      return { success: true, data: tag }
    } catch (error) {
      console.error('Error creating tag:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Update a tag's name
   */
  ipcMain.handle(IPC_CHANNELS.TAGS_UPDATE, (_event, args: { id: string; name: string }) => {
    try {
      const tag = TagRepository.update(args.id, args.name)
      if (!tag) {
        return { success: false, error: 'Tag not found' }
      }
      return { success: true, data: tag }
    } catch (error) {
      console.error('Error updating tag:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Delete a tag (removes from snippets, does not delete snippets)
   */
  ipcMain.handle(IPC_CHANNELS.TAGS_DELETE, (_event, args: { id: string }) => {
    try {
      const deleted = TagRepository.delete(args.id)
      if (!deleted) {
        return { success: false, error: 'Tag not found' }
      }
      return { success: true, data: true }
    } catch (error) {
      console.error('Error deleting tag:', error)
      return { success: false, error: String(error) }
    }
  })

  // ========================================
  // Settings Handlers
  // ========================================

  /**
   * Get all settings
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    try {
      return { success: true, data: getEffectiveSettings() }
    } catch (error) {
      console.error('Error getting settings:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Update settings
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, (_event, args: Partial<Settings>) => {
    try {
      SettingsRepository.update(args)
      if ('quick_capture_shortcut' in args) {
        registerQuickCaptureShortcut()
      }
      return { success: true, data: getEffectiveSettings() }
    } catch (error) {
      console.error('Error updating settings:', error)
      return { success: false, error: String(error) }
    }
  })

  // ========================================
  // AI Handlers
  // ========================================

  ipcMain.handle(
    IPC_CHANNELS.AI_RUN,
    async (_event, args: { snippetId: string; type: AiActionType }) => {
      try {
        const aiRun = await aiService.runOnSnippet(args.snippetId, args.type)
        return { success: true, data: aiRun }
      } catch (error) {
        console.error('Error running AI:', error)
        return { success: false, error: String(error) }
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.AI_LIST_FOR_SNIPPET, async (_event, args: { snippetId: string }) => {
    try {
      const aiRuns = await aiService.listForSnippet(args.snippetId)
      return { success: true, data: aiRuns }
    } catch (error) {
      console.error('Error listing AI runs:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.AI_TEST_CONNECTION, async () => {
    try {
      const result = await aiService.testConnection()
      return { success: true, data: result }
    } catch (error) {
      console.error('Error testing AI connection:', error)
      return { success: false, error: String(error) }
    }
  })

  // ========================================
  // Fragment Handlers
  // ========================================

  /**
   * Create a new fragment
   */
  ipcMain.handle(IPC_CHANNELS.FRAGMENTS_CREATE, (_event, args: CreateFragmentPayload) => {
    try {
      const fragment = FragmentRepository.create(args)
      return { success: true, data: fragment }
    } catch (error) {
      console.error('Error creating fragment:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Update an existing fragment
   */
  ipcMain.handle(IPC_CHANNELS.FRAGMENTS_UPDATE, (_event, args: UpdateFragmentPayload) => {
    try {
      const fragment = FragmentRepository.update(args.id, args)
      if (!fragment) {
        return { success: false, error: 'Fragment not found' }
      }
      return { success: true, data: fragment }
    } catch (error) {
      console.error('Error updating fragment:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Delete a fragment
   */
  ipcMain.handle(IPC_CHANNELS.FRAGMENTS_DELETE, (_event, args: { id: string }) => {
    try {
      const deleted = FragmentRepository.delete(args.id)
      return { success: true, data: deleted }
    } catch (error) {
      console.error('Error deleting fragment:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Reorder fragments within a snippet
   */
  ipcMain.handle(
    IPC_CHANNELS.FRAGMENTS_REORDER,
    (_event, args: { snippetId: string; fragmentIds: string[] }) => {
      try {
        FragmentRepository.reorder(args.snippetId, args.fragmentIds)
        return { success: true, data: true }
      } catch (error) {
        console.error('Error reordering fragments:', error)
        return { success: false, error: String(error) }
      }
    }
  )

  // ========================================
  // Backup & System Handlers
  // ========================================

  /**
   * Get the database file path
   */
  ipcMain.handle(IPC_CHANNELS.DB_PATH, () => {
    try {
      return { success: true, data: getDatabaseFilePath() }
    } catch (error) {
      console.error('Error getting DB path:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Export/backup the database to a user-selected location
   */
  ipcMain.handle(IPC_CHANNELS.BACKUP_EXPORT, async () => {
    try {
      const dbPath = getDatabaseFilePath()
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const defaultFileName = `fragment-backup-${timestamp}.db`

      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Export Library Backup',
        defaultPath: defaultFileName,
        filters: [
          { name: 'SQLite Database', extensions: ['db'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Export canceled' }
      }

      // Copy the database file
      copyFileSync(dbPath, result.filePath)

      // Save the export path in settings
      SettingsRepository.set('dbBackupLastPath', result.filePath)

      return { success: true, data: result.filePath }
    } catch (error) {
      console.error('Error exporting backup:', error)
      return { success: false, error: String(error) }
    }
  })

  console.log('IPC handlers registered successfully.')
}
