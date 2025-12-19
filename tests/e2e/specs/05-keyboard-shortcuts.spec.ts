import { test, expect } from '../utils/base-test'

test.describe('Keyboard Shortcuts', () => {
  test('creates snippet with Meta+N', async ({ page }) => {
    await page.keyboard.press('Meta+N')
    await expect(page.getByPlaceholder('Snippet title...')).toBeVisible()
  })

  test('opens quick switcher with Meta+K', async ({ page }) => {
    await page.keyboard.press('Meta+K')
    await expect(page.getByPlaceholder('Search snippets...')).toBeVisible()
  })

  test('deletes selected snippet with Delete key', async ({ page, testUtils }) => {
    await testUtils.createSnippet('To Remove', 'console.log("bye")')
    await page.locator('[data-testid="snippet-row"][data-title="To Remove"]').first().click()
    await page.keyboard.press('Delete')
    await expect(page.getByText('No snippet selected')).toBeVisible()
  })
})
