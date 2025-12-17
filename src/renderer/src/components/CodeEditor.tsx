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

const auroraHighlightStyle = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.controlKeyword],
    color: '#C792EA',
    fontWeight: 600,
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.regexp, tags.docString],
    color: '#7CE38B',
  },
  {
    tag: [tags.number, tags.bool, tags.atom],
    color: '#F5906C',
  },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: '#82AFFF',
  },
  {
    tag: [tags.variableName, tags.self, tags.propertyName],
    color: '#E1EFFF',
  },
  {
    tag: [tags.typeName, tags.className, tags.tagName],
    color: '#FFD580',
  },
  {
    tag: [tags.attributeName],
    color: '#FF7BC3',
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: '#6E7C94',
    fontStyle: 'italic',
  },
  {
    tag: [tags.punctuation, tags.separator],
    color: 'rgba(226, 232, 240, 0.6)',
  },
]);

const auroraTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    fontSize: '13.5px',
    fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
  },
  '.cm-content': {
    padding: '18px 0 32px',
    caretColor: 'var(--primary)',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: '1.65',
  },
  '.cm-line': {
    padding: '0 22px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 14px 0 0',
    color: 'color-mix(in srgb, var(--muted-foreground) 85%, transparent)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    color: 'var(--foreground)',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--accent) 60%, transparent)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--primary)',
    borderLeftWidth: '2px',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
    color: 'var(--muted-foreground)',
  },
  '.cm-tooltip': {
    border: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
    backgroundColor: 'color-mix(in srgb, var(--background) 95%, transparent)',
  },
  '.cm-panels': {
    borderTop: '1px solid var(--border)',
  },
});

const DEFAULT_EXTENSIONS = [auroraTheme, syntaxHighlighting(auroraHighlightStyle), EditorView.lineWrapping];

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
  const extensions = React.useMemo(() => {
    const exts = [...DEFAULT_EXTENSIONS];

    const langExt = languageExtensions[language];
    if (langExt) {
      exts.push(langExt());
    }

    return exts;
  }, [language]);

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
        'group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_35px_70px_-35px_rgba(15,23,42,0.85)] backdrop-blur',
        'focus-within:border-primary/60 focus-within:shadow-[0_40px_80px_-32px_rgba(56,189,248,0.45)]',
        className
      )}
      data-focused={isFocused ? 'true' : undefined}
    >
      <div className="pointer-events-none absolute inset-0 opacity-65 transition-opacity duration-500 group-focus-within:opacity-90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(124,228,187,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground backdrop-blur-lg dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground/80">
        <div className="flex flex-wrap items-center gap-3 text-[10px] tracking-[0.4em]">
          <span className="flex items-center gap-2">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" aria-hidden />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </span>
            <span className="font-semibold text-muted-foreground dark:text-muted-foreground/90">
              {languageLabel}
            </span>
          </span>
          <span className="rounded-full border border-white/30 bg-white/70 px-2 py-0.5 text-[10px] font-medium tracking-normal text-muted-foreground shadow-sm dark:border-white/5 dark:bg-white/10 dark:text-muted-foreground/80">
            {readOnly ? 'Read only' : 'Live editing'}
          </span>
        </div>

        <div className="relative flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="relative size-8 rounded-full border border-white/30 bg-white/70 text-foreground shadow-sm backdrop-blur-lg transition-all hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/90"
                  onClick={handleCopy}
                  disabled={!value.length}
                >
                  <span className="sr-only">Copy code</span>
                  <AnimatePresence mode="wait" initial={false}>
                    {copyState === 'copied' ? (
                      <motion.span
                        key="copied"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="text-emerald-500"
                      >
                        <Check className="size-4" />
                      </motion.span>
                    ) : copyState === 'copying' ? (
                      <motion.span
                        key="copying"
                        initial={{ rotate: -45, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 45, opacity: 0 }}
                      >
                        <Loader2 className="size-4 animate-spin text-primary" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Copy className="size-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 opacity-0 blur-xl transition-opacity duration-300 data-[copied=true]:opacity-100" data-copied={copyState === 'copied'} />
                </Button>
              }
            />
            <TooltipPopup>{copyState === 'copied' ? 'Copied!' : 'Copy to clipboard'}</TooltipPopup>
          </Tooltip>

          <AnimatePresence>
            {copyState === 'copied' && (
              <motion.span
                key="copy-feedback"
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="rounded-full border border-emerald-300/60 bg-emerald-400/90 px-2.5 py-0.5 text-[11px] font-medium text-white shadow-lg shadow-emerald-500/30"
                role="status"
                aria-live="polite"
              >
                Copied!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 flex-1" style={{ minHeight: 'inherit' }}>
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-4 bottom-0 h-16"
          style={{
            background:
              'linear-gradient(180deg, rgba(2, 6, 23, 0) 0%, color-mix(in srgb, var(--background) 85%, transparent) 90%)',
          }}
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
