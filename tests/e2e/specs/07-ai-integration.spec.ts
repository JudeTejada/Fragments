import { test, expect } from '../utils/base-test'

test.describe('AI Integration', () => {
  test.beforeEach(async ({ testUtils }) => {
    await testUtils.createSnippet('AI Test Snippet', 'function test() { return 42; }')
  })

  test('shows AI assistant section and disabled state', async ({ page }) => {
    await expect(page.getByText('AI assistant')).toBeVisible()
    await expect(page.getByText('Runs locally via Ollama; no cloud calls.')).toBeVisible()
    await expect(page.getByText('AI disabled')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Explain' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Add comments' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Usage example' })).toBeDisabled()
  })
})
