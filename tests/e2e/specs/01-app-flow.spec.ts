import { test, expect } from '../utils/base-test'
import { TEST_SNIPPETS } from '../fixtures/test-data'

test.describe('Application Flow (Electron)', () => {
  test('shows empty state on first launch', async ({ page, testUtils }) => {
    await testUtils.waitForAppLoad()
    await expect(page.getByText('No snippets yet')).toBeVisible()
    await expect(page.getByText('Create your first snippet to get started')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Snippet' })).toBeVisible()
    await expect(page.getByText('No snippet selected')).toBeVisible()
  })

  test('creates a snippet and displays it', async ({ page, testUtils }) => {
    await testUtils.createSnippet('Test Snippet', 'console.log("test");')
    await expect(page.getByPlaceholder('Snippet title...')).toHaveValue('Test Snippet')
    await expect(page.locator('.cm-content')).toContainText('console.log("test");')
    await expect(page.getByText('Saved')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Test Snippet' })).toBeVisible()
  })

  test('navigates between multiple snippets', async ({ page, testUtils }) => {
    await testUtils.createSnippet(TEST_SNIPPETS[0].title, TEST_SNIPPETS[0].content)
    await testUtils.createSnippet(TEST_SNIPPETS[1].title, TEST_SNIPPETS[1].content)

    await page.locator(`[data-testid="snippet-row"][data-title="${TEST_SNIPPETS[0].title}"]`).first().click()
    await expect(page.getByPlaceholder('Snippet title...')).toHaveValue(TEST_SNIPPETS[0].title)

    await page.locator(`[data-testid="snippet-row"][data-title="${TEST_SNIPPETS[1].title}"]`).first().click()
    await expect(page.getByPlaceholder('Snippet title...')).toHaveValue(TEST_SNIPPETS[1].title)
  })

  test('persists snippets after reload', async ({ page, testUtils }) => {
    await testUtils.createSnippet('Persistent Snippet', 'persistent content')
    await page.reload()
    await testUtils.waitForAppLoad()
    const persistentRow = page.locator('[data-testid="snippet-row"][data-title="Persistent Snippet"]')
    await expect(persistentRow).toBeVisible()
    await persistentRow.click()
    await expect(page.locator('.cm-content')).toContainText('persistent content')
  })
})
