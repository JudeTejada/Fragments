import { test, expect } from '../utils/base-test'

test.describe('Snippet Management', () => {
  test.beforeEach(async ({ testUtils }) => {
    await testUtils.createSnippet('Manage Me', 'console.log("hi")')
  })

  test('adds and removes tags', async ({ page, testUtils }) => {
    await testUtils.addTag('javascript')
    await testUtils.addTag('testing')
    await expect(page.getByText('#javascript', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('#testing', { exact: true }).first()).toBeVisible()

    const removeButton = page.getByRole('button', { name: 'Remove javascript' }).first()
    await removeButton.click({ force: true })
    await expect(page.getByText('#javascript')).toBeHidden()
  })

  test('toggles favorite state', async ({ page, testUtils }) => {
    await testUtils.toggleFavorite()
    await expect(page.getByRole('button', { name: 'Remove from favorites' })).toBeVisible()
    await testUtils.toggleFavorite()
    await expect(page.getByRole('button', { name: 'Add to favorites' })).toBeVisible()
  })

  test('deletes a snippet', async ({ page, testUtils }) => {
    await testUtils.deleteSnippet()
    await expect(page.getByText('Select a snippet')).toBeVisible()
  })

  test('edits title and notes and saves', async ({ page }) => {
    // Edit title using input
    const titleInput = page.locator('h1 input').first()
    await titleInput.fill('Updated Title')

    // Edit notes
    await page.getByPlaceholder('Add notes about this snippet...').fill('Some notes')
    await expect(page.getByText('Saved')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Updated Title' })).toBeVisible()
  })
})
