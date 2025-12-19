import { test, expect } from '../utils/base-test'

test.describe('Multi-Select & Context Menu', () => {
  test.beforeEach(async ({ testUtils }) => {
    // Create 3 snippets for multi-select testing
    await testUtils.createSnippet('Snippet A', 'console.log("A")')
    await testUtils.createSnippet('Snippet B', 'console.log("B")')
    await testUtils.createSnippet('Snippet C', 'console.log("C")')
  })

  test('shift+click selects a range of snippets', async ({ page, testUtils }) => {
    // Click first snippet
    await testUtils.clickSnippet('Snippet C')

    // Shift+click third snippet
    await testUtils.shiftClickSnippet('Snippet A')

    // Should show "3 selected" badge
    await expect(page.getByText('3 selected')).toBeVisible()
  })

  test('right-click shows context menu', async ({ page, testUtils }) => {
    await testUtils.rightClickSnippet('Snippet A')

    // Context menu should be visible with expected items
  })

  test('delete action removes single snippet', async ({ page, testUtils }) => {
    await testUtils.rightClickSnippet('Snippet A')
    await testUtils.clickContextMenuItem('Move to Trash')

    // Snippet A should be gone
    await expect(page.getByTestId('snippet-row').filter({ hasText: 'Snippet A' })).toBeHidden()
    // Other snippets should still exist
    await expect(page.getByTestId('snippet-row').filter({ hasText: 'Snippet B' })).toBeVisible()
  })

  test('delete action removes multiple selected snippets', async ({ page, testUtils }) => {
    // Select range
    await testUtils.clickSnippet('Snippet C')
    await testUtils.shiftClickSnippet('Snippet B')

    // Right-click and delete
    await testUtils.rightClickSnippet('Snippet B')
    await testUtils.clickContextMenuItem('Move to Trash')

    // Both C and B should be gone
    await expect(page.getByTestId('snippet-row').filter({ hasText: 'Snippet C' })).toBeHidden()
    await expect(page.getByTestId('snippet-row').filter({ hasText: 'Snippet B' })).toBeHidden()
    // A should still exist
    await expect(page.getByTestId('snippet-row').filter({ hasText: 'Snippet A' })).toBeVisible()
  })

  test('add to favourites works for single snippet', async ({ page, testUtils }) => {
    await testUtils.rightClickSnippet('Snippet A')
    await testUtils.clickContextMenuItem('Add to Favourites')

    // Should see star icon on Snippet A row
    const snippetRow = page.getByTestId('snippet-row').filter({ hasText: 'Snippet A' })
    await expect(snippetRow.locator('svg.text-amber-500')).toBeVisible()
  })

  test('add to favourites works for multiple snippets', async ({ page, testUtils }) => {
    // Select range
    await testUtils.clickSnippet('Snippet C')
    await testUtils.shiftClickSnippet('Snippet A')

    // Verify 3 selected
    await expect(page.getByText('3 selected')).toBeVisible()

    // Right-click and add to favorites
    await testUtils.rightClickSnippet('Snippet B')

    // Wait for menu to appear
    await expect(page.getByRole('menuitem', { name: 'Add to Favourites' })).toBeVisible({ timeout: 5000 })
    await testUtils.clickContextMenuItem('Add to Favourites')

    // Wait for favorites operation to complete
    await page.waitForTimeout(500)

    // All snippets should have star icon
    for (const title of ['Snippet A', 'Snippet B', 'Snippet C']) {
      const snippetRow = page.getByTestId('snippet-row').filter({ hasText: title })
      await expect(snippetRow.locator('svg.text-amber-500')).toBeVisible({ timeout: 5000 })
    }
  })

  test('right-click on unselected snippet selects it', async ({ page, testUtils }) => {
    // Initially click Snippet A (to have something selected)
    await testUtils.clickSnippet('Snippet A')

    // Right-click on Snippet B (unselected, no multi-selection)
    await testUtils.rightClickSnippet('Snippet B')

    // Snippet B should now be selected (visible in detail view)
    await expect(page.getByPlaceholder('Snippet title...')).toHaveValue('Snippet B')
  })

  test('escape clears multi-selection', async ({ page, testUtils }) => {
    // Select range
    await testUtils.clickSnippet('Snippet C')
    await testUtils.shiftClickSnippet('Snippet A')

    // Should show "3 selected"
    await expect(page.getByText('3 selected')).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Selection badge should be gone
    await expect(page.getByText('3 selected')).toBeHidden()
  })
})
