import { test, expect } from '../utils/base-test'

test.describe('Settings & Preferences', () => {
  test.beforeEach(async ({ testUtils }) => {
    await testUtils.openSettings()
  })

  test('shows database path and metadata', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByLabel('Database Location')).toBeVisible()
    await expect(page.locator('#db-path')).not.toHaveValue('')
    await expect(page.getByText('All data stays on your device')).toBeVisible()
  })

  test('allows choosing AI backend', async ({ page }) => {
    const select = page.locator('[data-slot="select-trigger"]').first()
    await select.click()
    await expect(page.getByRole('option', { name: 'None' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Ollama (local)' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByLabel('Ollama model')).toBeVisible()
  })

  test('records quick capture shortcut', async ({ page }) => {
    const shortcutBox = page.locator('div[role="textbox"]').first()
    await shortcutBox.click()
    await page.keyboard.press('Meta+Shift+K')
    await expect(shortcutBox).toContainText('CommandOrControl')
  })

  test('shows export backup control', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Export Backup' })).toBeVisible()
  })
})
