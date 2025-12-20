import { Page, expect } from '@playwright/test'

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  html: 'HTML',
  css: 'CSS',
  markdown: 'Markdown',
  json: 'JSON',
  plaintext: 'Plain Text'
}

export class TestUtils {
  constructor(private page: Page) {}

  async waitForAppLoad() {
    await this.page.waitForLoadState('domcontentloaded')
    // Wait for the sidebar to be visible with the filter buttons
    await this.page.getByTestId('filter-all').waitFor({ state: 'visible', timeout: 15000 })
    await this.page.getByTestId('filter-favorites').waitFor({ state: 'visible' })
  }

  async clickNewSnippet() {
    const newSnippetButton = this.page.getByRole('button', { name: 'New Snippet' }).first()
    await newSnippetButton.click()
    await this.waitForSnippetDetail()
  }

  async createSnippet(title: string, content: string, language?: string) {
    await this.clickNewSnippet()
    // Type into the input inside h1
    const titleInput = this.page.locator('h1 input').first()
    await titleInput.focus()
    await titleInput.fill('')
    await titleInput.fill(title)

    await this.page.locator('.cm-content').fill(content, { force: true })
    if (language && language !== 'plaintext') {
      await this.selectLanguage(language)
    }
    await this.waitForSaveIndicator()
    // Wait for snippet row to appear in sidebar with retry
    await this.waitForSnippetRow(title)
  }

  async selectLanguage(language: string) {
    const label = LANGUAGE_LABELS[language] ?? language
    // Click the language selector button in the editor header
    const langButton = this.page.getByRole('button', { name: /plain text|javascript|typescript|python|html|css|markdown|json/i }).first()
    await langButton.click()
    await this.page.waitForTimeout(200)
    // Select from the dropdown
    await this.page.getByRole('button', { name: label }).click()
    await this.page.waitForTimeout(200)
  }

  async deleteSnippet() {
    await this.page.getByRole('button', { name: 'Move to Trash' }).click()
    await this.page.waitForTimeout(150)
  }

  async toggleFavorite() {
    const favButton = this.page
      .getByRole('button', { name: /add to favorites|remove from favorites/i })
      .first()
    await favButton.click()
    await this.page.waitForTimeout(150)
  }

  async addTag(tagName: string) {
    const input = this.page.getByPlaceholder('+ Tag')
    await input.fill(tagName)
    await input.press('Enter')
    await this.page.waitForTimeout(150)
  }

  async openQuickSwitcher() {
    await this.page.keyboard.press('Meta+K')
    await this.page.getByPlaceholder('Search snippets...').waitFor({ state: 'visible' })
  }

  async searchViaQuickSwitcher(query: string) {
    await this.openQuickSwitcher()
    await this.page.getByPlaceholder('Search snippets...').fill(query)
    await this.page.waitForTimeout(150)
  }

  async openSettings() {
    await this.page.getByRole('button', { name: 'Settings' }).click()
    await this.page.getByRole('dialog').waitFor()
  }

  async closeSettings() {
    await this.page.getByRole('dialog').press('Escape')
    await this.page.getByRole('dialog').waitFor({ state: 'hidden' })
  }

  async waitForSnippetDetail() {
    // Wait for the title input to be visible
    await this.page.locator('h1 input').first().waitFor({ state: 'visible' })
  }

  async waitForSaveIndicator() {
    const saved = this.page.getByText('Saved')
    await saved.waitFor({ state: 'visible', timeout: 10000 })
  }

  async waitForSnippetRow(title: string, maxRetries = 5) {
    const selector = `[data-testid="snippet-row"][data-title="${title}"]`
    for (let i = 0; i < maxRetries; i++) {
      const row = this.page.locator(selector)
      const count = await row.count()
      if (count > 0) {
        await row.first().waitFor({ state: 'visible', timeout: 2000 })
        return
      }
      await this.page.waitForTimeout(500)
    }
    // Final attempt with regular waitForSelector
    await this.page.locator(selector).first().waitFor({ state: 'visible', timeout: 5000 })
  }

  async getSnippetTitles(): Promise<string[]> {
    const items = this.page.getByRole('button').filter({ hasText: /./ }).all()
    const titles: string[] = []
    for (const item of await items) {
      const text = await item.textContent()
      if (text && text.trim() && !['All Snippets', 'Favorites'].includes(text.trim())) {
        titles.push(text.trim())
      }
    }
    return titles
  }

  async clickSnippet(title: string) {
    await this.page.getByTestId('snippet-row').filter({ hasText: title }).first().click()
    await this.page.waitForTimeout(100)
  }

  async shiftClickSnippet(title: string) {
    await this.page
      .getByTestId('snippet-row')
      .filter({ hasText: title })
      .first()
      .click({ modifiers: ['Shift'] })
    await this.page.waitForTimeout(100)
  }

  async rightClickSnippet(title: string) {
    await this.page
      .getByTestId('snippet-row')
      .filter({ hasText: title })
      .first()
      .click({ button: 'right' })
    await this.page.waitForTimeout(100)
  }

  async clickContextMenuItem(name: string) {
    await this.page.getByRole('menuitem', { name }).click()
    await this.page.waitForTimeout(150)
  }
}
