import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView } from '@codemirror/view';
import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip';
import { SUPPORTED_LANGUAGES } from '@shared/types';
import { cn } from '@/lib/utils';

// Language extension mapping
const languageExtensions: Record<string, () => ReturnType<typeof javascript>> = {
  javascript: () => javascript({ jsx: true }),
  typescript: () => javascript({ jsx: true, typescript: true }),
  python: () => python(),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  markdown: () => markdown(),
};

const cursorDarkHighlightStyle = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.controlKeyword],
    color: '#C586C0',
    fontWeight: 500,
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.regexp, tags.docString],
    color: '#CE9178',
  },
  {
    tag: [tags.number, tags.bool, tags.atom],
    color: '#B5CEA8',
  },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: '#DCDCAA',
  },
  {
    tag: [tags.variableName, tags.self, tags.propertyName],
    color: '#9CDCFE',
  },
  {
    tag: [tags.typeName, tags.className, tags.tagName],
    color: '#4EC9B0',
  },
  {
    tag: [tags.attributeName],
    color: '#9CDCFE',
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: '#6A9955',
    fontStyle: 'italic',
  },
  {
    tag: [tags.punctuation, tags.separator],
    color: '#D4D4D4',
  },
]);

// Cursor-inspired colors for LIGHT mode (darker for contrast)
const cursorLightHighlightStyle = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.controlKeyword],
    color: '#AF00DB',
    fontWeight: 500,
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.regexp, tags.docString],
    color: '#A31515',
  },
  {
    tag: [tags.number, tags.bool, tags.atom],
    color: '#098658',
  },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: '#795E26',
  },
  {
    tag: [tags.variableName, tags.self, tags.propertyName],
    color: '#001080',
  },
  {
    tag: [tags.typeName, tags.className, tags.tagName],
    color: '#267F99',
  },
  {
    tag: [tags.attributeName],
    color: '#0451A5',
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: '#008000',
    fontStyle: 'italic',
  },
  {
    tag: [tags.punctuation, tags.separator],
    color: '#383a42',
  },
]);

const cursorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    fontSize: '13px',
    fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
  },
  '.cm-content': {
    padding: '16px 0',
    caretColor: 'var(--primary)',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: '1.6',
  },
  '.cm-line': {
    padding: '0 16px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 12px 0 0',
    color: '#858585',
    fontSize: '12px',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    color: 'var(--foreground)',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--muted) 50%, transparent)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--primary)',
    borderLeftWidth: '1.5px',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--muted)',
    color: 'var(--muted-foreground)',
  },
  '.cm-tooltip': {
    border: '1px solid var(--border)',
    backgroundColor: 'var(--popover)',
  },
  '.cm-panels': {
    borderTop: '1px solid var(--border)',
  },
});

type CopyState = 'idle' | 'copying' | 'copied';

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
}

export function CodeEditor({
  value,
  language = 'plaintext',
  onChange,
  readOnly = false,
  className,
  placeholder = 'Enter your code here...',
}: CodeEditorProps) {
  // Detect dark mode
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(isDark);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const extensions = React.useMemo(() => {
    // Use appropriate color scheme based on theme
    const highlightStyle = isDarkMode ? cursorDarkHighlightStyle : cursorLightHighlightStyle;
    const exts = [cursorTheme, syntaxHighlighting(highlightStyle), EditorView.lineWrapping];

    const langExt = languageExtensions[language];
    if (langExt) {
      exts.push(langExt());
    }

    return exts;
  }, [language, isDarkMode]);

  const [copyState, setCopyState] = React.useState<CopyState>('idle');
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const languageLabel = React.useMemo(() => {
    const match = SUPPORTED_LANGUAGES.find((item) => item.value === language);
    if (match) {
      return match.label;
    }
    if (!language || language === 'plaintext') {
      return 'Plain text';
    }
    return language.charAt(0).toUpperCase() + language.slice(1);
  }, [language]);

  const handleCopy = React.useCallback(async () => {
    if (!value) {
      return;
    }

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }

    try {
      setCopyState('copying');
      await writeToClipboard(value);
      setCopyState('copied');
      copyTimeoutRef.current = setTimeout(() => {
        setCopyState('idle');
        copyTimeoutRef.current = null;
      }, 1800);
    } catch (error) {
      console.error('Failed to copy snippet', error);
      setCopyState('idle');
    }
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  const handleEditorChange = React.useCallback(
    (val: string) => {
      onChange?.(val);
    },
    [onChange]
  );

  const handleFocus = React.useCallback(() => setIsFocused(true), []);
  const handleBlur = React.useCallback(() => setIsFocused(false), []);

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card',
        className
      )}
      data-focused={isFocused ? 'true' : undefined}
    >
      <div className="relative flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {languageLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            {readOnly ? 'Read only' : 'Editing'}
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                onClick={handleCopy}
                disabled={!value.length}
              >
                <span className="sr-only">Copy code</span>
                <AnimatePresence mode="wait" initial={false}>
                  {copyState === 'copied' ? (
                    <motion.span
                      key="copied"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-success"
                    >
                      <Check className="size-4" />
                    </motion.span>
                  ) : copyState === 'copying' ? (
                    <motion.span
                      key="copying"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 className="size-4 animate-spin" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Copy className="size-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            }
          />
          <TooltipPopup>{copyState === 'copied' ? 'Copied!' : 'Copy to clipboard'}</TooltipPopup>
        </Tooltip>
      </div>

      <div className="relative flex-1" style={{ minHeight: 'inherit' }}>
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
            indentOnInput: true,
          }}
          className="text-sm"
          aria-label={`${languageLabel} code editor`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{ minHeight: 'inherit' }}
        />
      </div>
    </div>
  );
}

async function writeToClipboard(text: string) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
