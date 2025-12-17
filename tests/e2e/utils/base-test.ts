import { test as base, expect, Page, _electron as electron, ElectronApplication } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'
import { TestUtils } from './test-utils'

export interface TestFixtures {
  testUtils: TestUtils
  electronApp: ElectronApplication
  page: Page
}

export const test = base.extend<TestFixtures>({
  electronApp: async ({}, use, testInfo) => {
    const userDataDir = path.join(testInfo.outputDir, 'user-data')
    await fs.rm(userDataDir, { recursive: true, force: true })
    await fs.mkdir(userDataDir, { recursive: true })

    const app = await electron.launch({
      args: ['.'],
      cwd: process.cwd(),
      env: {
        ...process.env,
        E2E_USER_DATA_DIR: userDataDir,
        ELECTRON_ENABLE_LOGGING: '1',
        ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
        NODE_ENV: 'test',
      },
    })

    await use(app)
    await app.close()
  },

  page: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow()
    await window.waitForLoadState('domcontentloaded')
    await use(window)
  },

  testUtils: async ({ page }, use) => {
    const utils = new TestUtils(page)
    await utils.waitForAppLoad()
    await use(utils)
  },
})

export { expect }
