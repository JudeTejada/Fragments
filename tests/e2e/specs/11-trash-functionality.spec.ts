import { test, expect } from '../utils/base-test'

test.describe('Trash / Recently Deleted Functionality', () => {
  test.beforeEach(async ({ testUtils }) => {
    // Create test snippets
    await testUtils.createSnippet('Old Snippet', '// Old code')
    await testUtils.createSnippet('Recent Snippet', '// Recent code')
    await testUtils.createSnippet('Middle Snippet', '# Middle code')
  })

  test('should show Recently Deleted in sidebar with count', async ({ page, testUtils }) => {
    // Verify Recently Deleted appears in sidebar under Favorites
    await expect(page.locator('[data-testid="filter-recently-deleted"]')).toBeVisible()

    // Initially count should be 0 - get the specific trash count for Recently Deleted
    const trashCount = page.locator(
      '[data-testid="filter-recently-deleted"] [data-testid="trash-count"]'
    )
    await expect(trashCount).toHaveText('0')

    // Verify sidebar structure by checking individual elements
    await expect(page.locator('[data-testid="filter-all"]')).toContainText('All Snippets')
    await expect(page.locator('[data-testid="filter-favorites"]')).toContainText('Favorites')
    await expect(page.locator('[data-testid="filter-recently-deleted"]')).toContainText(
      'Recently Deleted'
    )
  })

  test('should move snippet to trash via context menu', async ({ page, testUtils }) => {
    // Get the first snippet title before deletion
    const firstSnippet = page.locator('[data-testid="snippet-row"]').first()
    const snippetTitle = await firstSnippet.getAttribute('data-title')

    // Right-click on first snippet to open context menu
    await firstSnippet.click({ button: 'right' })

    // Verify context menu has "Move to Trash" option
    const moveToTrashOption = page.locator('[data-testid="context-menu-delete"]')
    await expect(moveToTrashOption).toBeVisible()
    await expect(moveToTrashOption).toContainText('Move to Trash')

    // Click "Move to Trash"
    await moveToTrashOption.click()

    // Wait for UI to update and verify the specific snippet is gone
    await expect(
      page.locator(`[data-testid="snippet-row"][data-title="${snippetTitle}"]`)
    ).not.toBeVisible()

    // Verify trash count increases
    await expect(
      page.locator('[data-testid="filter-recently-deleted"] [data-testid="trash-count"]')
    ).toHaveText('1')
  })

  test('should navigate to trash view and back', async ({ page, testUtils }) => {
    // Move a snippet to trash first
    const firstSnippet = page.locator('[data-testid="snippet-row"]').first()
    await firstSnippet.click({ button: 'right' })
    await page.locator('[data-testid="context-menu-delete"]').click()

    // Click on Recently Deleted in sidebar
    await page.locator('[data-testid="filter-recently-deleted"]').click()

    // Verify we're now in trash view
    await expect(page.locator('[data-testid="trash-view"]')).toBeVisible()
    await expect(page.locator('h2')).toContainText('Recently Deleted')

    // Verify we can go back using the back button
    await page.locator('[data-testid="back-to-snippets"]').click()

    // Verify we're back to main snippets view
    await expect(page.locator('[data-testid="trash-view"]')).toBeHidden()
    // Use a more specific selector to avoid strict mode violations
    await expect(page.locator('[data-testid="snippet-row"]').first()).toBeVisible()
  })

  test('should restore snippet from trash', async ({ page, testUtils }) => {
    // Setup: Move snippet to trash
    const firstSnippet = page.locator('[data-testid="snippet-row"]').first()
    const snippetTitle = await firstSnippet.getAttribute('data-title')
    await firstSnippet.click({ button: 'right' })
    await page.locator('[data-testid="context-menu-delete"]').click()

    await page.locator('[data-testid="filter-recently-deleted"]').click()

    // Click restore button on trashed snippet
    const restoreButton = page
      .locator('[data-testid="trash-item"] [data-testid="restore-button"]')
      .first()
    await restoreButton.click()

    // Manually navigate back to main view since restore doesn't auto-navigate
    await page.locator('[data-testid="back-to-snippets"]').click()

    // Verify we're back to main snippets view
    await expect(page.locator('[data-testid="trash-view"]')).toBeHidden()

    // Verify restored snippet appears in main list
    const restoredSnippet = page.locator(
      `[data-testid="snippet-row"][data-title="${snippetTitle}"]`
    )
    await expect(restoredSnippet).toBeVisible()

    // Verify trash count decreases
    await expect(
      page.locator('[data-testid="filter-recently-deleted"] [data-testid="trash-count"]')
    ).toHaveText('0')
  })

  test('should exit trash view when clicking normal navigation', async ({ page, testUtils }) => {
    // Move a snippet to trash
    const firstSnippet = page.locator('[data-testid="snippet-row"]').first()
    await firstSnippet.click({ button: 'right' })
    await page.locator('[data-testid="context-menu-delete"]').click()

    // Go to trash view
    await page.locator('[data-testid="filter-recently-deleted"]').click()
    await expect(page.locator('[data-testid="trash-view"]')).toBeVisible()

    // Click "All Snippets" to exit trash view
    await page.locator('[data-testid="filter-all"]').click()
    await expect(page.locator('[data-testid="trash-view"]')).toBeHidden()
    // Use a more specific selector to avoid strict mode violations
    await expect(page.locator('[data-testid="snippet-row"]').first()).toBeVisible()
  })
})
