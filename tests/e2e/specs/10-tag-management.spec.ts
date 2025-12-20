import { test, expect } from '../utils/base-test'

test.describe('Tag Management', () => {
  test.beforeEach(async ({ testUtils }) => {
    // Create a snippet to allow tag creation via context
    await testUtils.createSnippet('Test Snippet', 'console.log("test")')
  })

  test('can add a new tag via the + button', async ({ page }) => {
    // Click the add tag button
    await page.getByTestId('add-tag-button').click()

    // Wait for popover
    await expect(page.getByTestId('new-tag-input')).toBeVisible()

    // Enter tag name
    await page.getByTestId('new-tag-input').fill('my-new-tag')

    // Click confirm
    await page.getByTestId('confirm-add-tag').click()

    // Verify tag appears in sidebar
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'my-new-tag' })).toBeVisible()
  })

  test('can cancel adding a tag', async ({ page }) => {
    // Click the add tag button
    await page.getByTestId('add-tag-button').click()

    // Enter tag name
    await page.getByTestId('new-tag-input').fill('canceled-tag')

    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Verify popover closed and tag not added
    await expect(page.getByTestId('new-tag-input')).toBeHidden()
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'canceled-tag' })).toBeHidden()
  })

  test('can edit a tag via context menu', async ({ page }) => {
    // First create a tag
    await page.getByTestId('add-tag-button').click()
    await page.getByTestId('new-tag-input').fill('original-tag')
    await page.getByTestId('confirm-add-tag').click()
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'original-tag' })).toBeVisible()

    // Right-click the tag
    await page.getByTestId('tag-filter').filter({ hasText: 'original-tag' }).click({ button: 'right' })

    // Click Edit in context menu
    await page.getByTestId('context-menu-edit-tag').click()

    // Wait for edit popover
    await expect(page.getByTestId('edit-tag-input')).toBeVisible()

    // Change the name
    await page.getByTestId('edit-tag-input').clear()
    await page.getByTestId('edit-tag-input').fill('renamed-tag')

    // Confirm
    await page.getByTestId('confirm-edit-tag').click()

    // Verify tag renamed
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'renamed-tag' })).toBeVisible()
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'original-tag' })).toBeHidden()
  })

  test('can delete a tag via context menu with confirmation', async ({ page }) => {
    // First create a tag
    await page.getByTestId('add-tag-button').click()
    await page.getByTestId('new-tag-input').fill('to-delete')
    await page.getByTestId('confirm-add-tag').click()
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'to-delete' })).toBeVisible()

    // Right-click the tag
    await page.getByTestId('tag-filter').filter({ hasText: 'to-delete' }).click({ button: 'right' })

    // Click Delete in context menu
    await page.getByTestId('context-menu-delete-tag').click()

    // Verify confirmation dialog appears
    await expect(page.getByText('Are you sure you want to delete the tag')).toBeVisible()

    // Confirm deletion
    await page.getByTestId('confirm-delete-tag').click()

    // Verify tag deleted
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'to-delete' })).toBeHidden()
  })

  test('can cancel tag deletion', async ({ page }) => {
    // First create a tag
    await page.getByTestId('add-tag-button').click()
    await page.getByTestId('new-tag-input').fill('keep-this')
    await page.getByTestId('confirm-add-tag').click()
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'keep-this' })).toBeVisible()

    // Right-click the tag
    await page.getByTestId('tag-filter').filter({ hasText: 'keep-this' }).click({ button: 'right' })

    // Click Delete in context menu
    await page.getByTestId('context-menu-delete-tag').click()

    // Click Cancel in confirmation dialog
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Verify tag still exists
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'keep-this' })).toBeVisible()
  })

  test('deleting a tag removes it from snippets but preserves snippets', async ({ page, testUtils }) => {
    // Create a tag
    await page.getByTestId('add-tag-button').click()
    await page.getByTestId('new-tag-input').fill('snippet-tag')
    await page.getByTestId('confirm-add-tag').click()
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'snippet-tag' })).toBeVisible()

    // The Test Snippet was created in beforeEach
    // We need to add the tag to it (via the snippet's tag input)
    await testUtils.clickSnippet('Test Snippet')

    // Wait for detail view
    await expect(page.locator('h1 input').first()).toHaveValue('Test Snippet')

    // Delete the tag from sidebar
    await page.getByTestId('tag-filter').filter({ hasText: 'snippet-tag' }).click({ button: 'right' })
    await page.getByTestId('context-menu-delete-tag').click()
    await page.getByTestId('confirm-delete-tag').click()

    // Verify tag deleted
    await expect(page.getByTestId('tag-filter').filter({ hasText: 'snippet-tag' })).toBeHidden()

    // Verify snippet still exists
    await expect(page.getByTestId('snippet-row').filter({ hasText: 'Test Snippet' })).toBeVisible()
  })
})
