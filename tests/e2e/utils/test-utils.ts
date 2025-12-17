import { Page, expect } from '@playwright/test'

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  html: 'HTML',
  css: 'CSS',
  markdown: 'Markdown',
  json: 'JSON',
  plaintext: 'Plain Text',
}

export class TestUtils {
  constructor(private page: Page) {}

  async waitForAppLoad() {
    await this.page.waitForLoadState('domcontentloaded')
    await this.page.getByText('Snippets', { exact: false }).first().waitFor()
    await this.page.getByTestId('sidebar-search').waitFor({ state: 'visible' })
  }

  async clickNewSnippet() {
    const newSnippetButton = this.page.getByRole('button', { name: 'New Snippet' }).first()
    await newSnippetButton.click()
    await this.waitForSnippetDetail()
  }

  async createSnippet(title: string, content: string, language?: string) {
    await this.clickNewSnippet()
    await this.page.getByPlaceholder('Snippet title...').fill(title)
    await this.page.locator('.cm-content').fill(content, { force: true })
    if (language && language !== 'plaintext') {
      await this.selectLanguage(language)
    }
    await this.waitForSaveIndicator()
    await this.page.waitForSelector(`[data-testid="snippet-row"][data-title="${title}"]`, { timeout: 10000 })
  }

  async selectLanguage(language: string) {
    const label = LANGUAGE_LABELS[language] ?? language
    const trigger = this.page.locator('[data-slot="select-trigger"]').first()
    await trigger.click()
    const option = this.page.locator('[data-slot="select-item"]', { hasText: label }).first()
    await option.waitFor({ state: 'visible' })
    await option.click({ force: true })
    await this.page.keyboard.press('Escape')
  }

  async deleteSnippet() {
    await this.page.getByRole('button', { name: 'Delete' }).click()
    await this.page.waitForTimeout(150)
  }

  async toggleFavorite() {
    const favButton = this.page.getByRole('button', { name: /add to favorites|remove from favorites/i }).first()
    await favButton.click()
    await this.page.waitForTimeout(150)
  }

  async addTag(tagName: string) {
    const input = this.page.getByPlaceholder('Add tag...')
    await input.fill(tagName)
    await input.press('Enter')
    await this.page.waitForTimeout(150)
  }

  async searchSnippet(query: string) {
    await this.page.getByTestId('sidebar-search').fill(query)
    await this.page.waitForTimeout(300)
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
    await this.page.getByPlaceholder('Snippet title...').waitFor({ state: 'visible' })
  }

  async waitForSaveIndicator() {
    const saved = this.page.getByText('Saved')
    await saved.waitFor({ state: 'visible', timeout: 10000 })
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
}
