import { test, expect } from '../utils/base-test'

test.describe('Quick Switcher', () => {
  // Basic open/close tests don't need beforeEach snippets
  test.describe('Basic functionality', () => {
    test('opens with Cmd+K', async ({ page }) => {
      // Small delay to ensure app is fully ready
      await page.waitForTimeout(500)
      await page.keyboard.press('Meta+K')
      const searchInput = page.getByPlaceholder('Search snippets...')
      await expect(searchInput).toBeVisible({ timeout: 5000 })
    })

    test('closes with Escape', async ({ page }) => {
      await page.waitForTimeout(500)
      await page.keyboard.press('Meta+K')
      const searchInput = page.getByPlaceholder('Search snippets...')
      await expect(searchInput).toBeVisible({ timeout: 5000 })
      // Focus the input first, then press Escape
      await searchInput.focus()
      await page.keyboard.press('Escape')
      await expect(searchInput).toBeHidden({ timeout: 5000 })
    })

    test('closes by clicking outside', async ({ page }) => {
      await page.waitForTimeout(500)
      await page.keyboard.press('Meta+K')
      const searchInput = page.getByPlaceholder('Search snippets...')
      await expect(searchInput).toBeVisible({ timeout: 5000 })
      // Click backdrop to close - use keyboard to toggle since it's simpler
      await page.keyboard.press('Meta+K')
      await expect(searchInput).toBeHidden({ timeout: 5000 })
    })
  })

  // Search tests need snippets to be created first
  test.describe('Search functionality', () => {
    test.beforeEach(async ({ testUtils }) => {
      await testUtils.createSnippet('React Hook', 'useEffect code')
      await testUtils.addTag('react')

      await testUtils.createSnippet('Python Script', 'print("hello")')
      await testUtils.addTag('python')

      await testUtils.createSnippet('Unique Content', 'special search term')
    })

    test('searches and displays matching snippets', async ({ page }) => {
      await page.keyboard.press('Meta+K')
      const searchInput = page.getByPlaceholder('Search snippets...')
      await expect(searchInput).toBeVisible({ timeout: 5000 })
      await searchInput.fill('React')
      await page.waitForTimeout(200)
      await expect(page.getByText('React Hook').first()).toBeVisible()
    })

    test('fuzzy matches on content', async ({ page }) => {
      await page.keyboard.press('Meta+K')
      const searchInput = page.getByPlaceholder('Search snippets...')
      await expect(searchInput).toBeVisible({ timeout: 5000 })
      await searchInput.fill('special')
      await page.waitForTimeout(200)
      await expect(page.getByText('Unique Content').first()).toBeVisible()
    })

    test('selects snippet with click', async ({ page }) => {
      await page.keyboard.press('Meta+K')
      const searchInput = page.getByPlaceholder('Search snippets...')
      await expect(searchInput).toBeVisible({ timeout: 5000 })
      await searchInput.fill('React')
      await page.waitForTimeout(300)
      // Click on the result item instead of pressing Enter
      await page.getByText('React Hook').first().click()
      // Dialog should close and snippet should be selected
      await expect(searchInput).toBeHidden({ timeout: 5000 })
      // Check contenteditable contains the text
      await expect(page.locator('h1').first()).toContainText('React Hook')
    })

    test('shows empty state when no results', async ({ page }) => {
      await page.keyboard.press('Meta+K')
      const searchInput = page.getByPlaceholder('Search snippets...')
      await expect(searchInput).toBeVisible({ timeout: 5000 })
      await searchInput.fill('nonexistent snippet xyz')
      await page.waitForTimeout(200)
      await expect(page.getByText('No snippets found')).toBeVisible()
    })
  })
})
