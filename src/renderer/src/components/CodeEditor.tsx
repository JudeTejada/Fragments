import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import * as React from 'react';
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

// Light theme based on Things 3 aesthetic
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
  },
  '.cm-content': {
    padding: '12px 0',
    caretColor: 'hsl(var(--foreground))',
  },
  '.cm-line': {
    padding: '0 16px',
  },
  '.cm-cursor': {
    borderLeftColor: 'hsl(var(--foreground))',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'hsl(var(--accent))',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'hsl(var(--accent))',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: 'none',
    color: 'hsl(var(--muted-foreground))',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLine': {
    backgroundColor: 'hsl(var(--accent) / 0.3)',
  },
  '.cm-foldGutter': {
    width: '16px',
  },
});

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
    const exts = [lightTheme, EditorView.lineWrapping];

    const langExt = languageExtensions[language];
    if (langExt) {
      exts.push(langExt());
    }

    return exts;
  }, [language]);

  return (
    <div className={cn(
      'rounded-xl border border-border bg-card overflow-hidden',
      'shadow-sm',
      className
    )}>
      <CodeMirror
        value={value}
        onChange={onChange}
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
      />
    </div>
  );
}
