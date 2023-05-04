import { expect, test } from '@playwright/test'
import {
  findLatestBuild,
  parseElectronApp,
} from 'electron-playwright-helpers'
import type { ElectronApplication, Page } from 'playwright'
import { _electron as electron } from 'playwright'

let app: ElectronApplication
let page: Page

test.beforeAll(async () => {
  const build = findLatestBuild()
  const appInfo = parseElectronApp(build)
  app = await electron.launch({
    args: [appInfo.main],
    executablePath: appInfo.executable,
  })
  app.on('window', async (page) => {
    const filename = page.url()?.split('/').pop()
    console.log(`Window opened: ${filename}`)

    // capture errors
    page.on('pageerror', (error) => {
      console.error(error)
    })
    // capture console messages
    page.on('console', (msg) => {
      console.log(msg.text())
    })
  })
})

test.afterAll(async () => {
  await app.close()
})

test('renders the first page', async () => {
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  const h1 = await page.getByRole('heading')
  const text = await h1.innerText()
  expect(text).toContain('Hello World!')
})
