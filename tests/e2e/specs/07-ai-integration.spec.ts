import { test, expect } from '../utils/base-test'

test.describe('AI Integration', () => {
  test.beforeEach(async ({ testUtils }) => {
    await testUtils.createSnippet('AI Test Snippet', 'function test() { return 42; }')
  })

  test('shows AI assistant section and disabled state', async ({ page }) => {
    const aiToggle = page.getByRole('button', { name: 'AI Assistant' })
    await expect(aiToggle).toBeVisible()
    await aiToggle.click()
    await expect(
      page.getByText('Enable AI in Settings to use your local Ollama model.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Explain' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Add comments' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Usage example' })).toBeDisabled()
  })
})
