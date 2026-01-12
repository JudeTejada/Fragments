---
name: vite-react-ts-expert
description: Vite + React + TypeScript development. Use for: (1) Vite config and plugins, (2) TypeScript path aliases (@/, @renderer/), (3) React component patterns with hooks, (4) type inference and generics, (5) performance optimization, (6) code splitting, (7) environment variables.
---

# Vite + React + TypeScript Expert

## Path Aliases

```ts
// tsconfig.web.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/src/*"],
      "@renderer/*": ["src/renderer/src/*"]
    }
  }
}

// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src/renderer/src'),
    '@renderer': path.resolve(__dirname, 'src/renderer/src'),
  }
}
```

## React + TypeScript Patterns

```tsx
// Generic hook pattern
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initial
  })
  // ...
}

// Component props with discriminated union
type SnippetCardProps =
  | { mode: 'view'; snippet: Snippet }
  | { mode: 'edit'; snippet: Snippet; onSave: (s: Snippet) => void }
```

## Vite Optimization

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@base-ui', 'lucide-react'],
        }
      }
    }
  }
})
```

## Key Patterns

- Named exports for tree shaking
- `useMemo`/`useCallback` for expensive computations
- `React.lazy` for route-based code splitting
- Environment variables with `import.meta.env`
- Zod for runtime type validation
