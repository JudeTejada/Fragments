import { test, expect } from '../utils/base-test'

test.describe('Quick Switcher', () => {
  test.beforeEach(async ({ testUtils }) => {
    // Create some snippets to search
    await testUtils.createSnippet('React Hook', 'useEffect code')
    await testUtils.addTag('react')

    await testUtils.createSnippet('Python Script', 'print("hello")')
    await testUtils.addTag('python')

    await testUtils.createSnippet('Unique Content', 'special search term')
  })

  test('opens with Cmd+K', async ({ page }) => {
    await page.keyboard.press('Meta+K')
    await expect(page.getByPlaceholder('Search snippets...')).toBeVisible()
  })

  test('closes with Escape', async ({ page }) => {
    await page.keyboard.press('Meta+K')
    await expect(page.getByPlaceholder('Search snippets...')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByPlaceholder('Search snippets...')).toBeHidden()
  })

  test('searches and displays matching snippets', async ({ page }) => {
    await page.keyboard.press('Meta+K')
    await page.getByPlaceholder('Search snippets...').fill('React')
    await expect(page.getByText('React Hook').first()).toBeVisible()
  })

  test('fuzzy matches on content', async ({ page }) => {
    await page.keyboard.press('Meta+K')
    await page.getByPlaceholder('Search snippets...').fill('special')
    await expect(page.getByText('Unique Content').first()).toBeVisible()
  })

  test('selects snippet with Enter', async ({ page }) => {
    await page.keyboard.press('Meta+K')
    await page.getByPlaceholder('Search snippets...').fill('React')
    await page.waitForTimeout(200)
    await page.keyboard.press('Enter')
    // Dialog should close and snippet should be selected
    await expect(page.getByPlaceholder('Search snippets...')).toBeHidden()
    await expect(page.getByPlaceholder('Snippet title...')).toHaveValue('React Hook')
  })

  test('shows empty state when no results', async ({ page }) => {
    await page.keyboard.press('Meta+K')
    await page.getByPlaceholder('Search snippets...').fill('nonexistent snippet xyz')
    await expect(page.getByText('No snippets found')).toBeVisible()
  })
})
