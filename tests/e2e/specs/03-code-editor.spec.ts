import { test, expect } from '../utils/base-test'

test.describe('Code Editor', () => {
  test.beforeEach(async ({ testUtils }) => {
    await testUtils.clickNewSnippet()
  })

  test('renders editor and accepts input', async ({ page }) => {
    await expect(page.locator('.cm-editor')).toBeVisible()
    await page.locator('.cm-content').fill('console.log("Hello");', { force: true })
    await expect(page.locator('.cm-content')).toContainText('console.log')
  })

  test('changes language and shows save indicator', async ({ page, testUtils }) => {
    // Type into the title input
    const titleInput = page.locator('h1 input').first()
    await titleInput.fill('Language Test')

    await page.locator('.cm-content').fill('const x: number = 1;', { force: true })
    await testUtils.selectLanguage('typescript')
    await testUtils.waitForSaveIndicator()
  })

  test('debounces saves after edits', async ({ page }) => {
    // Type into the title input
    const titleInput = page.locator('h1 input').first()
    await titleInput.fill('Debounce Test')

    await page.locator('.cm-content').fill('initial', { force: true })
    await expect(page.getByText('Saved')).toBeVisible()

    await page.locator('.cm-content').fill('changed content', { force: true })
    await expect(page.getByText('Saved')).toBeVisible()
  })

  test('handles large content', async ({ page }) => {
    const large = Array.from({ length: 60 }, (_, i) => `line ${i}`).join('\n')
    await page.locator('.cm-content').fill(large, { force: true })
    const text = await page.locator('.cm-content').innerText()
    expect(text.length).toBeGreaterThan(200)
  })

  test('switches between snippets without leaking content', async ({ page, testUtils }) => {
    // First snippet
    const titleInput = page.locator('h1 input').first()
    await titleInput.fill('First')
    await page.locator('.cm-content').fill('first content', { force: true })

    // Create second snippet
    await testUtils.clickNewSnippet()

    // Type second title
    const titleInput2 = page.locator('h1 input').first()
    await titleInput2.fill('Second')

    await expect(page.locator('.cm-content')).not.toContainText('first content')
  })
})
