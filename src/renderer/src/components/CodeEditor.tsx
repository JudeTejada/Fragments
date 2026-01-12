import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { sql } from '@codemirror/lang-sql'
import { go } from '@codemirror/lang-go'
import { rust } from '@codemirror/lang-rust'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { php } from '@codemirror/lang-php'
import { yaml } from '@codemirror/lang-yaml'
import { xml } from '@codemirror/lang-xml'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { EditorView, keymap } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, ChevronDown, Loader2, FileCode } from 'lucide-react'

import { cn } from '@/lib/utils'
import { SUPPORTED_LANGUAGES } from '@shared/types'

// Language extension mapping
const languageExtensions: Record<string, () => Extension> = {
  javascript: () => javascript({ jsx: true }),
  typescript: () => javascript({ jsx: true, typescript: true }),
  python: () => python(),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  markdown: () => markdown(),
  sql: () => sql(),
  bash: () => cpp(),
  go: () => go(),
  rust: () => rust(),
  java: () => java(),
  cpp: () => cpp(),
  csharp: () => cpp(),
  php: () => php(),
  ruby: () => cpp(),
  swift: () => cpp(),
  kotlin: () => java(),
  yaml: () => yaml(),
  xml: () => xml()
}

// Calm, muted syntax highlighting for LIGHT mode
const cursorLightHighlightStyle = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.controlKeyword],
    color: '#7c3aed', // Muted purple
    fontWeight: 500
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.regexp, tags.docString],
    color: '#059669' // Muted emerald
  },
  {
    tag: [tags.number, tags.bool, tags.atom],
    color: '#d97706' // Muted amber
  },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: '#2563eb' // Muted blue
  },
  {
    tag: [tags.variableName, tags.self, tags.propertyName],
    color: '#0891b2' // Muted cyan
  },
  {
    tag: [tags.typeName, tags.className, tags.tagName],
    color: '#7c3aed' // Muted purple (same as keyword for subtlety)
  },
  {
    tag: [tags.attributeName],
    color: '#0891b2'
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: '#9ca3af', // Gray
    fontStyle: 'italic'
  },
  {
    tag: [tags.punctuation, tags.separator],
    color: '#6b7280' // Gray-500
  }
])

// Dark mode syntax highlighting (muted)
const cursorDarkHighlightStyle = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.controlKeyword],
    color: '#a78bfa',
    fontWeight: 500
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.regexp, tags.docString],
    color: '#34d399'
  },
  {
    tag: [tags.number, tags.bool, tags.atom],
    color: '#fbbf24'
  },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: '#60a5fa'
  },
  {
    tag: [tags.variableName, tags.self, tags.propertyName],
    color: '#22d3ee'
  },
  {
    tag: [tags.typeName, tags.className, tags.tagName],
    color: '#a78bfa'
  },
  {
    tag: [tags.attributeName],
    color: '#22d3ee'
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: '#6b7280',
    fontStyle: 'italic'
  },
  {
    tag: [tags.punctuation, tags.separator],
    color: '#9ca3af'
  }
])

// Calm editor theme
const cursorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    fontSize: '13px',
    fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
    lineHeight: '1.5',
    height: '100%',
    flex: '1 1 auto'
  },
  '.cm-content': {
    padding: '16px 0',
    caretColor: 'var(--primary)',
    minHeight: '100%'
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: 'inherit',
    overflow: 'auto auto',
    flex: '1 1 auto'
  },
  '.cm-line': {
    padding: '0 16px'
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 16px 0 0',
    color: 'var(--muted-foreground)',
    fontSize: '12px',
    fontWeight: '400'
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: 'none',
    color: 'var(--muted-foreground)'
  },
  '.cm-activeLineGutter': {
    color: 'var(--foreground)',
    fontWeight: '500'
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--muted) 30%, transparent)'
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)'
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--primary)',
    borderLeftWidth: '1.5px'
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--muted)',
    color: 'var(--muted-foreground)',
    borderRadius: '2px'
  },
  '.cm-tooltip': {
    border: '1px solid var(--border)',
    backgroundColor: 'var(--popover)',
    borderRadius: '6px'
  },
  '.cm-panels': {
    borderTop: '1px solid var(--border)'
  },
  '.cm-panel.cm-search': {
    backgroundColor: 'var(--background)'
  }
})

const quickSwitcherKeymap = keymap.of([
  {
    key: 'Mod-k',
    run: () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('quick-switcher:open'))
      }
      return true
    }
  }
])

type CopyState = 'idle' | 'copying' | 'copied'

interface CodeEditorProps {
  value: string
  language?: string
  onChange?: (value: string) => void
  readOnly?: boolean
  className?: string
  placeholder?: string
  fragmentBar?: React.ReactNode
}

export function CodeEditor({
  value,
  language = 'plaintext',
  onChange,
  readOnly = false,
  className,
  placeholder = 'Enter your code here...',
  fragmentBar
}: CodeEditorProps) {
  // Detect dark mode
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark')
          setIsDarkMode(isDark)
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  const extensions = React.useMemo(() => {
    const highlightStyle = isDarkMode ? cursorDarkHighlightStyle : cursorLightHighlightStyle
    const exts = [
      cursorTheme,
      syntaxHighlighting(highlightStyle),
      EditorView.lineWrapping,
      quickSwitcherKeymap
    ]

    const langExt = languageExtensions[language]
    if (langExt) {
      exts.push(langExt())
    }

    return exts
  }, [language, isDarkMode])

  const [copyState, setCopyState] = React.useState<CopyState>('idle')
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const [showLangMenu, setShowLangMenu] = React.useState(false)
  const langMenuRef = React.useRef<HTMLDivElement>(null)

  const languageLabel = React.useMemo(() => {
    const match = SUPPORTED_LANGUAGES.find((item) => item.value === language)
    if (match) {
      return match.label
    }
    if (!language || language === 'plaintext') {
      return 'Plain text'
    }
    return language.charAt(0).toUpperCase() + language.slice(1)
  }, [language])

  const handleCopy = React.useCallback(async () => {
    if (!value || readOnly) {
      return
    }

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = null
    }

    try {
      setCopyState('copying')
      await navigator.clipboard.writeText(value)
      setCopyState('copied')
      copyTimeoutRef.current = setTimeout(() => {
        setCopyState('idle')
        copyTimeoutRef.current = null
      }, 1800)
    } catch {
      setCopyState('idle')
    }
  }, [value, readOnly])

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEditorChange = React.useCallback(
    (val: string) => {
      onChange?.(val)
    },
    [onChange]
  )

  const handleFocus = React.useCallback(() => setIsFocused(true), [])
  const handleBlur = React.useCallback(() => setIsFocused(false), [])

  const handleLanguageChange = (newLang: string) => {
    // Emit custom event for parent to handle language change
    window.dispatchEvent(
      new CustomEvent('snippet:change-language', {
        detail: { language: newLang }
      })
    )
    setShowLangMenu(false)
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden min-w-0',
        'rounded-xl border border-border/40 bg-muted/10',
        'shadow-sm transition-all duration-200',
        isFocused && 'ring-1 ring-primary/15 border-primary/30',
        className
      )}
    >
      {/* Fragment bar slot */}
      {fragmentBar}

      {/* Header Bar */}
      <div className="relative flex items-center justify-between px-3 py-2 bg-muted/20 border-b border-border/30">
        {/* Left: Language selector */}
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md',
            'text-xs font-medium text-foreground',
            'hover:bg-muted/50 transition-colors',
            'focus:outline-none focus:ring-1 focus:ring-primary/20'
          )}
        >
          <FileCode className="size-3.5 text-muted-foreground" />
          {languageLabel}
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>

        {/* Language dropdown menu */}
        <AnimatePresence>
          {showLangMenu && (
            <motion.div
              ref={langMenuRef}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full left-0 mt-1 z-50"
            >
              <div className="bg-popover border border-border/50 rounded-lg shadow-lg overflow-hidden py-1 min-w-[160px] max-h-[280px] overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleLanguageChange(lang.value)}
                    className={cn(
                      'w-full px-3 py-1.5 text-left text-xs',
                      'hover:bg-muted/50 transition-colors',
                      language === lang.value && 'bg-muted/50 text-foreground font-medium'
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right: Copy button + Read-only indicator */}
        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
              Read-only
            </span>
          )}
          <button
            onClick={handleCopy}
            disabled={!value.length || readOnly || copyState === 'copying'}
            className={cn(
              'p-1.5 rounded-md transition-all duration-150',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed',
              copyState === 'copied' && 'text-success'
            )}
            title={copyState === 'copied' ? 'Copied!' : 'Copy to clipboard'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copyState === 'copied' ? (
                <motion.div
                  key="copied"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <Check className="size-3.5" />
                </motion.div>
              ) : copyState === 'copying' ? (
                <motion.div
                  key="copying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="size-3.5 animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <Copy className="size-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div className="relative flex-1 min-h-0 h-full">
        <CodeMirror
          value={value}
          onChange={handleEditorChange}
          extensions={extensions}
          readOnly={readOnly}
          placeholder={placeholder}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true
          }}
          className="text-sm h-full"
          aria-label={`${languageLabel} code editor`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{ height: '100%', minHeight: 0 }}
        />
      </div>
    </div>
  )
}
