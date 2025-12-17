export interface SnippetFixture {
  title: string
  content: string
  language: string
  tags?: string[]
  notes?: string
  isFavorite?: boolean
}

export const TEST_SNIPPETS: SnippetFixture[] = [
  {
    title: 'Hello World JavaScript',
    content: `console.log('Hello, World!');`,
    language: 'javascript',
    tags: ['javascript', 'basics'],
    notes: 'A simple hello world example',
  },
  {
    title: 'React Component',
    content: `import React from 'react';

export const MyComponent = () => {
  return <div>Hello World</div>;
};`,
    language: 'javascript',
    tags: ['react', 'component'],
    notes: 'Basic React component structure',
  },
  {
    title: 'Python Function',
    content: `def greet(name: str) -> str:
    return f"Hello, {name}!"`,
    language: 'python',
    tags: ['python', 'function'],
  },
  {
    title: 'CSS Flexbox',
    content: `.container {
  display: flex;
  justify-content: center;
  align-items: center;
}`,
    language: 'css',
    tags: ['css', 'layout'],
  },
  {
    title: 'HTML Template',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`,
    language: 'html',
    tags: ['html', 'template'],
  },
]

export const TEST_TAGS = ['javascript', 'react', 'python', 'css', 'html', 'basics', 'function', 'component']

export const TEST_KEYBOARD_SHORTCUTS = {
  newSnippet: 'Meta+N',
  search: 'Meta+F',
  delete: 'Delete',
}

export const SUPPORTED_LANGUAGES = [
  'plaintext',
  'javascript',
  'typescript',
  'python',
  'html',
  'css',
  'markdown',
  'json',
]
