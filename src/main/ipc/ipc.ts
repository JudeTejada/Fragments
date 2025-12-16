// IPC Handlers - registers all IPC handlers for main process
import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { SnippetRepository } from '../repositories/snippetRepository';
import { TagRepository } from '../repositories/tagRepository';
import { SettingsRepository } from '../repositories/settingsRepository';
import type { CreateSnippetPayload, UpdateSnippetPayload, SearchParams, Settings } from '../../shared/types';

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
      return { success: true, data: SnippetRepository.list(args?.tagIds) };
    } catch (error) {
      console.error('Error listing snippets:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Get a single snippet by ID
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_GET, (_event, args: { id: string }) => {
    try {
      const snippet = SnippetRepository.get(args.id);
      if (!snippet) {
        return { success: false, error: 'Snippet not found' };
      }
      return { success: true, data: snippet };
    } catch (error) {
      console.error('Error getting snippet:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Create a new snippet
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_CREATE, (_event, args: CreateSnippetPayload) => {
    try {
      const snippet = SnippetRepository.create(args);
      return { success: true, data: snippet };
    } catch (error) {
      console.error('Error creating snippet:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Update an existing snippet
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_UPDATE, (_event, args: UpdateSnippetPayload) => {
    try {
      const snippet = SnippetRepository.update(args.id, args);
      if (!snippet) {
        return { success: false, error: 'Snippet not found' };
      }
      return { success: true, data: snippet };
    } catch (error) {
      console.error('Error updating snippet:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Delete a snippet
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_DELETE, (_event, args: { id: string }) => {
    try {
      const deleted = SnippetRepository.delete(args.id);
      if (!deleted) {
        return { success: false, error: 'Snippet not found' };
      }
      // Clean up orphaned tags
      TagRepository.deleteOrphaned();
      return { success: true, data: true };
    } catch (error) {
      console.error('Error deleting snippet:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Search snippets
   */
  ipcMain.handle(IPC_CHANNELS.SNIPPETS_SEARCH, (_event, args: SearchParams) => {
    try {
      const snippets = SnippetRepository.search(args);
      return { success: true, data: snippets };
    } catch (error) {
      console.error('Error searching snippets:', error);
      return { success: false, error: String(error) };
    }
  });

  // ========================================
  // Tag Handlers
  // ========================================

  /**
   * List all tags with snippet counts
   */
  ipcMain.handle(IPC_CHANNELS.TAGS_LIST, () => {
    try {
      return { success: true, data: TagRepository.list() };
    } catch (error) {
      console.error('Error listing tags:', error);
      return { success: false, error: String(error) };
    }
  });

  // ========================================
  // Settings Handlers
  // ========================================

  /**
   * Get all settings
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    try {
      return { success: true, data: SettingsRepository.getAll() };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Update settings
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, (_event, args: Partial<Settings>) => {
    try {
      const settings = SettingsRepository.update(args);
      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('IPC handlers registered successfully.');
}
