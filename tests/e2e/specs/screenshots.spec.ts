import { test, expect } from '../utils/base-test'
import path from 'path'
import fs from 'fs/promises'

const MOCK_SNIPPETS = [
  {
    title: 'React useState Hook',
    content: `import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}`,
    language: 'typescript',
    tags: ['react', 'hooks'],
    favorite: true
  },
  {
    title: 'Python FastAPI Setup',
    content: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items/")
async def create_item(item: Item):
    return {"item": item}`,
    language: 'python',
    tags: ['api', 'backend'],
    favorite: false
  },
  {
    title: 'Node.js Express Server',
    content: `const express = require('express')
const app = express()

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})`,
    language: 'javascript',
    tags: ['nodejs', 'express', 'api'],
    favorite: true
  },
  {
    title: 'HTML Component',
    content: `<div class="card">
  <h2>Card Title</h2>
  <p>Card description goes here.</p>
  <button>Click me</button>
</div>`,
    language: 'plaintext',
    tags: ['html', 'frontend'],
    favorite: false
  }
]

test.describe('Screenshots', () => {
  test('setup mock data and capture screenshots', async ({ testUtils, page }) => {
    test.setTimeout(120000)

    const screenshotsDir = path.join(process.cwd(), 'tests', 'e2e', 'screenshots')
    await fs.mkdir(screenshotsDir, { recursive: true })

    for (const snippet of MOCK_SNIPPETS) {
      await testUtils.createSnippet(snippet.title, snippet.content, snippet.language)

      if (snippet.tags) {
        for (const tag of snippet.tags) {
          await testUtils.addTag(tag)
        }
      }

      if (snippet.favorite) {
        await testUtils.toggleFavorite()
      }

      await page.getByRole('button', { name: 'All Snippets' }).click()
      await page.waitForTimeout(200)
    }

    await page.screenshot({
      path: path.join(screenshotsDir, 'snippet-list-all.png'),
      fullPage: false
    })

    await page.getByTestId('filter-favorites').click()
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(screenshotsDir, 'snippet-list-favorites.png'),
      fullPage: false
    })

    await page.getByTestId('filter-all').click()
    await page.waitForTimeout(300)
    const tagButton = page.getByRole('button', { name: 'react' }).first()
    if (await tagButton.isVisible()) {
      await tagButton.click()
      await page.waitForTimeout(300)
      await page.screenshot({
        path: path.join(screenshotsDir, 'snippet-list-tag-filter.png'),
        fullPage: false
      })
    }

    await page.getByTestId('filter-all').click()
    await page.waitForTimeout(300)
    await testUtils.clickSnippet('React useState Hook')
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(screenshotsDir, 'snippet-detail.png'),
      fullPage: false
    })

    const editor = page.locator('.cm-content').first()
    await editor.click()
    await page.waitForTimeout(200)
    await page.screenshot({
      path: path.join(screenshotsDir, 'code-editor.png'),
      fullPage: false
    })

    await testUtils.searchViaQuickSwitcher('react')
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(screenshotsDir, 'quick-switcher.png'),
      fullPage: false
    })

    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    await testUtils.openSettings()
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(screenshotsDir, 'settings.png'),
      fullPage: false
    })

    await testUtils.closeSettings()
    await testUtils.clickNewSnippet()
    await page.locator('h1 input').first().fill('New Snippet Example')
    await page.locator('.cm-content').first().fill('console.log("New snippet")')

    await page.screenshot({
      path: path.join(screenshotsDir, 'new-snippet.png'),
      fullPage: false
    })
  })

  test('dark mode screenshots', async ({ testUtils, page }) => {
    test.setTimeout(60000)

    const screenshotsDir = path.join(process.cwd(), 'tests', 'e2e', 'screenshots')
    await fs.mkdir(screenshotsDir, { recursive: true })

    await page.getByRole('button', { name: 'Settings' }).click()
    await page.waitForTimeout(300)

    const themeToggle = page.getByRole('button', { name: /theme|dark/i }).first()
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      await page.waitForTimeout(500)

      await page.getByRole('dialog').press('Escape')
      await page.waitForTimeout(300)

      await page.screenshot({
        path: path.join(screenshotsDir, 'dark-mode-list.png'),
        fullPage: false
      })

      await testUtils.clickSnippet('React useState Hook')
      await page.waitForTimeout(300)
      await page.screenshot({
        path: path.join(screenshotsDir, 'dark-mode-detail.png'),
        fullPage: false
      })
    }
  })
})
