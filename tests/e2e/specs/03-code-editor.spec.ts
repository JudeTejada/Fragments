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
    await page.getByPlaceholder('Snippet title...').fill('Language Test')
    await page.locator('.cm-content').fill('const x: number = 1;', { force: true })
    await testUtils.selectLanguage('typescript')
    await testUtils.waitForSaveIndicator()
  })

  test('debounces saves after edits', async ({ page }) => {
    await page.getByPlaceholder('Snippet title...').fill('Debounce Test')
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
    await page.getByPlaceholder('Snippet title...').fill('First')
    await page.locator('.cm-content').fill('first content', { force: true })
    await testUtils.clickNewSnippet()
    await page.getByPlaceholder('Snippet title...').fill('Second')
    await expect(page.locator('.cm-content')).not.toContainText('first content')
  })
})
