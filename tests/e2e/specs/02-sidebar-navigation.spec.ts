import { test, expect } from '../utils/base-test'

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ testUtils, page }) => {
    await testUtils.createSnippet('JavaScript Snippet', 'console.log("hi")')
    await testUtils.addTag('javascript')
    await testUtils.toggleFavorite()

    await testUtils.createSnippet('Python Snippet', 'print("hi")')
    await testUtils.addTag('python')

    await testUtils.createSnippet('Notes', 'plain text')
    await page.waitForTimeout(200)
  })

  test('filters favorites', async ({ page }) => {
    await page.getByTestId('filter-favorites').click()
    await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible()
    await expect(page.locator('[data-title="JavaScript Snippet"]')).toBeVisible()
    await expect(page.locator('[data-title="Python Snippet"]')).toHaveCount(0)
  })

  test('filters by tag', async ({ page }) => {
    const tagButtons = page.getByTestId('tag-filter')
    await tagButtons.first().click()
    await expect(page.locator('[data-title="JavaScript Snippet"]')).toBeVisible()
    await expect(page.locator('[data-title="Python Snippet"]')).toHaveCount(0)
  })

  test('searches snippets', async ({ page }) => {
    await page.getByTestId('sidebar-search').fill('Python')
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible()
    await expect(page.locator('[data-title="Python Snippet"]')).toBeVisible()
    await expect(page.locator('[data-title="JavaScript Snippet"]')).toHaveCount(0)
  })

  test('clears filters via All Snippets', async ({ page }) => {
    await page.getByTestId('filter-favorites').click()
    await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible()

    await page.getByTestId('filter-all').click()
    await expect(page.getByRole('heading', { name: 'All Snippets' })).toBeVisible()
    await expect(page.locator('[data-title="Python Snippet"]')).toBeVisible()
  })
})
