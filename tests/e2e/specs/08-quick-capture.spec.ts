import { test, expect } from '../utils/base-test'

test.describe('Quick Capture Modal', () => {
  test.beforeEach(async ({ electronApp, page }) => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]
      win.webContents.send('quick-capture:new-snippet', { content: 'console.log("captured");' })
    })
    await page.getByRole('dialog').waitFor()
  })

  test('opens with clipboard content', async ({ page }) => {
    await expect(page.getByText('Quick capture')).toBeVisible()
    await expect(page.getByPlaceholder('Title (optional)')).toBeFocused()
    await expect(page.getByPlaceholder('Your clipboard content...')).toContainText('console.log("captured");')
  })

  test('supports editing and tags', async ({ page }) => {
    await page.getByPlaceholder('Title (optional)').fill('Captured Snippet')
    await page.getByPlaceholder('Your clipboard content...').fill('new content')
    await page.getByPlaceholder('Add a tag and press Enter').fill('quick')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Remove quick' })).toBeVisible()
  })

  test('saves snippet and closes modal', async ({ page }) => {
    await page.getByPlaceholder('Title (optional)').fill('Save From Quick Capture')
    await page.getByRole('button', { name: 'Save snippet' }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await expect(page.getByRole('button', { name: 'Save From Quick Capture' })).toBeVisible()
  })
})
