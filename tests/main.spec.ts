import { expect, test } from '@playwright/test'
import {
  findLatestBuild,
  parseElectronApp,
} from 'electron-playwright-helpers'
import type { ElectronApplication, Page } from 'playwright'
import { _electron as electron } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync } from 'fs'
import { axeViolationsToCsv } from '../utilities/axe-results-parser'

test.describe('An Electron app', () => {
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

  test('the first page renders', async () => {
    page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    const h1 = await page.getByRole('heading')
    const text = await h1.innerText()
    expect(text).toContain('Hello World!')
  })

  test('accessibility', async () => {
    const results = await new AxeBuilder({ page }).setLegacyMode().analyze()
    const json = await axeViolationsToCsv(results, page, 'a11y test', 'chromium', true, test.info())
    const ts = (new Date()).getTime()
    const path = `json-output/${ts}-a11y-violations.json`
    writeFileSync(path, json)
    await test.info().attach('a11y-violations.json', { contentType: 'application/json', path })
    expect(results.violations.length).toBe(0)
  })
})

