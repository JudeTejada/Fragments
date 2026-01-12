// Direct store exports - no aggregation, no backward compatibility
// Import stores directly where needed: useSnippetStore, useTagStore, etc.

export { useSnippetStore, snippetStore } from './snippet-store'
export { useTagStore, tagStore } from './tag-store'
export { useUiStore, uiStore } from './ui-store'
export { useTrashStore, trashStore } from './trash-store'
export { useFavoritesStore, favoritesStore } from './favorites-store'

// Derived hooks (these are computed values, worth keeping)
export { useFilteredSnippets, useSelectedSnippet, SnippetProvider } from './derived'
