// Shared types for the Code Snippets application

export type AiActionType = 'explain' | 'comment' | 'usage_example'

export type AiBackend = 'none' | 'ollama'

export interface AiRun {
  id: string
  snippetId: string
  type: AiActionType
  result: string
  createdAt: string
}

export interface Snippet {
  id: string
  title: string
  language: string
  content: string
  notes: string | null
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  tags: Tag[]
}

export interface Tag {
  id: string
  name: string
  count?: number
}

export interface Settings {
  dbBackupLastPath?: string
  ai_backend?: AiBackend
  ollama_model_name?: string
  quick_capture_shortcut?: string
  trash_retention_days?: number
}

export interface TrashedSnippet extends Snippet {
  deletedAt: string
  daysSinceDeleted: number
  daysUntilDeletion: number
}

// IPC payload types
export interface CreateSnippetPayload {
  title: string
  language: string
  content: string
  notes?: string
  isFavorite?: boolean
  tags: string[]
}

export interface UpdateSnippetPayload {
  id: string
  title?: string
  language?: string
  content?: string
  notes?: string
  isFavorite?: boolean
  tags?: string[]
}

export interface SearchParams {
  query?: string
  tagIds?: string[]
}

// Language options for the editor
export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'plaintext', label: 'Plain Text' }
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['value']
