# End-to-End Testing Guide

This document provides comprehensive guidelines for writing and running end-to-end tests for the Code Snippets application using Playwright.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing New Tests](#writing-new-tests)
- [Test Patterns](#test-patterns)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The test suite uses **Playwright** for end-to-end testing of the Electron/React application. Tests are located in the `tests/e2e/` directory and cover:

- Application flow and navigation
- Snippet CRUD operations
- Code editor functionality
- Sidebar navigation and filtering
- Keyboard shortcuts
- Settings and preferences
- AI integration features
- Quick capture modal

## Test Structure

```
tests/e2e/
├── fixtures/
│   └── test-data.ts          # Shared test data and fixtures
├── utils/
│   ├── base-test.ts          # Base test class with fixtures
│   └── test-utils.ts         # Helper utilities
└── specs/
    ├── 01-app-flow.spec.ts           # Application startup and basic flow
    ├── 02-sidebar-navigation.spec.ts # Sidebar, search, filters
    ├── 03-code-editor.spec.ts        # CodeMirror editor tests
    ├── 04-snippet-management.spec.ts # Snippet CRUD operations
    ├── 05-keyboard-shortcuts.spec.ts # Keyboard shortcuts
    ├── 06-settings.spec.ts           # Settings and preferences
    ├── 07-ai-integration.spec.ts     # AI features
    └── 08-quick-capture.spec.ts      # Quick capture modal
```

## Running Tests

### Prerequisites

Install dependencies:

```bash
bun install
```

Install Playwright browsers:

```bash
npx playwright install chromium
```

### Available Commands

```bash
# Run all tests
bun test:e2e

# Run tests with UI mode (interactive)
bun test:e2e:ui

# Run tests in headed mode (see browser)
bun test:e2e:headed

# Run specific test file
bun test:e2e -- tests/e2e/specs/01-app-flow.spec.ts

# Run tests with grep pattern
bun test:e2e -g "should create a new snippet"

# Run tests in debug mode
bun test:e2e --debug

# Generate test report
bun test:e2e && npx playwright show-report
```

### CI/CD

Tests run automatically on CI. The configuration:
- Fully parallelized execution
- 2 retries on failure
- Screenshots on failure
- Video recordings on failure
- HTML report generation

## Writing New Tests

### Base Test Structure

All tests extend the base test class:

```typescript
import { test, expect } from '../utils/base-test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('should do something', async ({ page }) => {
    // Test implementation
  })
})
```

### Using TestUtils

The `TestUtils` class provides helper methods:

```typescript
test('should create snippet', async ({ page, testUtils }) => {
  await testUtils.createSnippet('Title', 'content', 'javascript')
  await expect(page.locator('text=Title')).toBeVisible()
})

test('should add tag', async ({ page, testUtils }) => {
  await testUtils.createSnippet('Test', 'code')
  await testUtils.addTag('mytag')
  await expect(page.locator('text=#mytag')).toBeVisible()
})

test('should filter by tag', async ({ page, testUtils }) => {
  await testUtils.filterByTag('javascript')
  await expect(page.locator('h2')).toHaveText('Search Results')
})
```

### Test Data

Use shared test data from fixtures:

```typescript
import { TEST_SNIPPETS } from '../fixtures/test-data'

test('should display all snippets', async ({ page }) => {
  for (const snippet of TEST_SNIPPETS) {
    // Create snippet
  }
})
```

### Locators and Selectors

Use semantic selectors:

```typescript
// Good - semantic and maintainable
await expect(page.locator('button[aria-label="New Snippet"]')).toBeVisible()
await expect(page.locator('[data-search-input]')).toBeFocused()

// Good - using test IDs (add to components)
await expect(page.locator('[data-testid="snippet-row"]')).toBeVisible()

// Avoid - brittle CSS selectors
await expect(page.locator('.sidebar > button:nth-child(1)')).toBeVisible()
```

### Assertions

Use Playwright's built-in assertions:

```typescript
// Visibility
await expect(page.locator('text=Title')).toBeVisible()
await expect(page.locator('text=Title')).toBeHidden()

// Value
await expect(page.locator('input')).toHaveValue('text')
await expect(page.locator('input')).toBeEmpty()

// State
await expect(page.locator('button')).toBeEnabled()
await expect(page.locator('button')).toBeDisabled()

// Count
const items = await page.locator('li').count()
expect(items).toBe(5)

// Custom
await expect(page.locator('text=Hello')).toContainText('ell')
```

## Test Patterns

### Pattern 1: CRUD Operations

```typescript
test('should create, read, update, delete snippet', async ({ page, testUtils }) => {
  // CREATE
  await testUtils.createSnippet('Test', 'content', 'javascript')

  // READ
  await expect(page.locator('text=Test')).toBeVisible()

  // UPDATE
  await page.fill('input[placeholder="Snippet title..."]', 'Updated')
  await testUtils.waitForSave()

  // DELETE
  await testUtils.deleteSnippet()
  await expect(page.locator('text=Updated')).toBeHidden()
})
```

### Pattern 2: Filtering and Search

```typescript
test('should filter snippets', async ({ page, testUtils }) => {
  // Setup test data
  await testUtils.createSnippet('JS Snippet', 'js code', 'javascript')
  await testUtils.createSnippet('Py Snippet', 'py code', 'python')

  // Test filter
  await testUtils.filterByTag('javascript')
  await expect(page.locator('text=JS Snippet')).toBeVisible()
  await expect(page.locator('text=Py Snippet')).toBeHidden()

  // Clear filter
  await testUtils.clearFilters()
  await expect(page.locator('text=JS Snippet')).toBeVisible()
})
```

### Pattern 3: Keyboard Shortcuts

```typescript
test('should respond to keyboard shortcuts', async ({ page }) => {
  // Test shortcut
  await page.keyboard.press('Meta+N')
  await expect(page.locator('input[title]')).toBeVisible()

  // Test with modifier
  await page.keyboard.press('Meta+F')
  const searchInput = page.locator('[data-search-input]')
  await expect(searchInput).toBeFocused()
})
```

### Pattern 4: Modal/Dialog Testing

```typescript
test('should handle modal', async ({ page }) => {
  // Open modal
  await page.click('button[aria-label="Settings"]')
  await expect(page.locator('[role="dialog"]')).toBeVisible()

  // Interact with modal
  await page.fill('input', 'value')

  // Close modal
  await page.keyboard.press('Escape')
  await expect(page.locator('[role="dialog"]')).toBeHidden()
})
```

### Pattern 5: Async Operations

```typescript
test('should handle async save', async ({ page }) => {
  await page.fill('input', 'value')

  // Wait for loading state
  await expect(page.locator('text=Loading...')).toBeVisible()

  // Wait for completion
  await expect(page.locator('text=Saved')).toBeVisible()

  // Wait for state to clear
  await expect(page.locator('text=Saved')).toBeHidden()
})
```

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```typescript
// Good - creates its own data
test('should filter by tag', async ({ page, testUtils }) => {
  await testUtils.createSnippet('Test', 'content')
  await testUtils.addTag('tag1')
  await testUtils.filterByTag('tag1')
})

// Bad - relies on previous test
test('should show filtered results', async ({ page }) => {
  // This test might fail if previous test doesn't run
})
```

### 2. Appropriate Wait Times

Use Playwright's auto-waiting instead of fixed delays:

```typescript
// Good - waits for element to be visible
await expect(page.locator('text=Saved')).toBeVisible()

// Good - waits for network idle
await page.waitForLoadState('networkidle')

// Avoid - fixed delays (unreliable)
await page.waitForTimeout(1000)
```

### 3. Descriptive Test Names

Use clear, descriptive test names:

```typescript
// Good
test('should create snippet with title and code', async ({ page }) => { })
test('should filter snippets by tag when tag is clicked', async ({ page }) => { })
test('should save changes automatically after 500ms debounce', async ({ page }) => { })

// Bad
test('create test', async ({ page }) => { })
test('filter test', async ({ page }) => { })
test('save test', async ({ page }) => { })
```

### 4. Test Setup and Teardown

Use `beforeEach` for common setup:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.waitForLoadState('networkidle')
})

test.describe('Code Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.click('button[aria-label="New Snippet"]')
    await page.waitForSelector('input[title]', { state: 'visible' })
  })

  // Tests use the pre-configured state
})
```

### 5. Avoid Testing Implementation Details

Test user-visible behavior, not internal implementation:

```typescript
// Good - tests user experience
await expect(page.locator('text=No snippets yet')).toBeVisible()
await expect(page.locator('button:has-text("Create Snippet")')).toBeVisible()

// Bad - tests internal state
const state = await page.evaluate(() => window.store.getState())
expect(state.snippets).toHaveLength(0)
```

### 6. Use Data Attributes for Testing

Add `data-testid` attributes to complex components:

```typescript
// In your component
<div data-testid="snippet-list">
  {snippets.map(snippet => (
    <div key={snippet.id} data-testid="snippet-row">
      {/* content */}
    </div>
  ))}
</div>

// In tests
await expect(page.locator('[data-testid="snippet-list"]')).toBeVisible()
const rows = page.locator('[data-testid="snippet-row"]')
expect(await rows.count()).toBe(5)
```

### 7. Mock External Dependencies

For tests requiring external services (like AI), mock or skip:

```typescript
test('should handle AI errors gracefully', async ({ page }) => {
  // Test error handling without actually calling AI
  await page.evaluate(() => {
    window.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
  })

  await page.click('button:has-text("Explain")')

  await expect(page.locator('text=Error')).toBeVisible()
})
```

### 8. Test Edge Cases

Don't forget to test edge cases:

```typescript
test('should handle empty state', async ({ page }) => {
  // No snippets exist
  await expect(page.locator('text=No snippets yet')).toBeVisible()
})

test('should handle special characters', async ({ page, testUtils }) => {
  await testUtils.createSnippet('Test: "Special" & Chars', 'content')
  await expect(page.locator('text=Test: "Special" & Chars')).toBeVisible()
})

test('should handle very long snippets', async ({ page, testUtils }) => {
  const longContent = 'x'.repeat(10000)
  await testUtils.createSnippet('Long', longContent)
  // Verify it saves without errors
})
```

## Adding New Test Files

### 1. Create Test File

```bash
touch tests/e2e/specs/09-my-feature.spec.ts
```

### 2. Basic Structure

```typescript
import { test, expect } from '../utils/base-test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('should do something', async ({ page }) => {
    // Test implementation
  })
})
```

### 3. Add Helper Methods

If you need new helper methods, add them to `test-utils.ts`:

```typescript
export class TestUtils {
  // ...

  async myCustomAction() {
    await this.page.click('button')
  }
}
```

### 4. Update Documentation

Add your test file to the structure section in this document.

## Troubleshooting

### Tests Timing Out

If tests timeout on CI but pass locally:

```typescript
// Increase timeout for slow operations
test('should do slow thing', async ({ page }) => {
  test.setTimeout(60000) // 60 seconds
  // test code
})

// Or use longer waits
await page.waitForSelector('selector', { timeout: 30000 })
```

### Flaky Tests

If tests occasionally fail:

1. Check for race conditions - use `waitForSelector` instead of timeouts
2. Ensure proper cleanup in `afterEach`
3. Use `test.step()` for complex flows
4. Add retries for known flaky operations

```typescript
test.describe.configure({ retries: 2 })
```

### Debugging Tests

Use the UI mode for debugging:

```bash
bun test:e2e:ui
```

Add debug points:

```typescript
test('debug test', async ({ page }) => {
  await page.pause() // Opens debugger
  // Or use
  await page.screenshot({ path: 'debug.png' })
})
```

### Browser Compatibility

Tests run on Chromium. If you need to test other browsers:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
```

### Performance Issues

If tests run slowly:

1. Use `test.describe.configure({ mode: 'serial' })` for dependent tests
2. Parallelize independent tests
3. Use `test.skip()` to skip expensive tests on CI
4. Reuse browser contexts when possible

## Continuous Integration

Tests automatically run on CI. To ensure reliable CI runs:

1. No tests should rely on local state
2. Use `test.skip()` for tests requiring manual setup
3. Set appropriate timeouts
4. Generate and upload test reports

```yaml
# Example GitHub Actions
- name: Run E2E tests
  run: bun test:e2e

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Testing Best Practices](https://playwright.dev/docs/test-best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)

## Questions?

For questions about testing:
1. Check existing tests for examples
2. Review Playwright documentation
3. Ask in team discussions
