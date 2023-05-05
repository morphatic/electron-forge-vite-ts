/**
 * Axe Results Parser
 *
 * The Axe a11y testing library can analyze a web page and generate results in JSON format.
 * In order to facilitate identifying and taking action on a11y issues, it would be useful to have
 * a way to convert the results into a list of discrete issues. That's what this method does.
 *
 * @module axe-results-parser
 */

import { createHash } from 'crypto'
import axe from 'axe-core'
import { Page, TestInfo } from '@playwright/test'
import { Parser } from '@json2csv/plainjs'

interface GlobalProperties {
  engine: string
  axeVersion: string
  userAgent: string
  windowWidth: number
  windowHeight: number
  orientationAngle?: number
  orientationType?: string
  timestamp: string
  url: string
}

interface CategoryProperties {
  type: string
  rule: string
  description: string
  help: string
  helpUrl: string
}

interface IssueProperties {
  impact?: axe.ImpactValue
  message: string
  target?: string
  parent?: string // relatedNodes.target
  failureSummary?: string
  screenshot?: string
}


export type Issue = GlobalProperties & CategoryProperties & IssueProperties

/**
 * Convert a11y violations reported in Axe results JSON into CSV that can be understood by
 * non-technical users and aid in identifying and fixing a11y issues.
 *
 * @param   {AxeResults} res     The results object returned by AxeBuilder().analyze()
 * @param   {Page}       page    The Playwright Page object being analyzed
 * @param   {string}     slug    A slugified version of the page title for screenshot filenames
 * @param   {string}     browser The browser in which the tests were run
 * @param   {boolean}    header  Should headers be output or not
 * @returns {string}             A CSV string with details about violations and how to fix them
 */
export const axeViolationsToCsv = async (res: axe.AxeResults, page: Page, slug: string, browser: string, header: boolean, info: TestInfo): Promise<string> => {
  const { violations } = res
  if (violations.length === 0) {
    // Return empty string if there are no violations
    return ''
  } else {
    const issues: Issue[] = []
    const {
      testEngine: { name: engine, version: axeVersion },
      testEnvironment: {
        userAgent,
        windowWidth,
        windowHeight,
        orientationAngle,
        orientationType
      },
      timestamp,
      url
    } = res
    const globalProps: GlobalProperties = {
      engine,
      axeVersion,
      userAgent,
      windowWidth,
      windowHeight,
      orientationAngle,
      orientationType,
      timestamp,
      url,
    }

    for (const result of res.violations) {
      const catProps: CategoryProperties = {
        type: 'violations',
        rule: result.id,
        description: result.description,
        help: result.help,
        helpUrl: result.helpUrl,
      }
      for (const node of result.nodes) {
        const related = node.any[0].relatedNodes && node.any[0].relatedNodes[0] || undefined
        const issueProps: IssueProperties = {
          impact: node.impact,
          message: node.any[0].message,
          target: node.target[0],
          parent: related && related.target[0],
          failureSummary: node.failureSummary,
        }
        const issue = { ...globalProps, ...catProps, ...issueProps }
        // get the CSS locator of the element with the issue
        const loc = issue.parent || issue.target
        if (loc && !issue.rule.includes('empty')) {
          try {
            const ts = (new Date(issue.timestamp)).getTime()
            const path = `screenshots/${ts}/${issue.type}/${browser}/` + getScreenshotPath(issue, slug)
            await page.locator(loc).screenshot({ path })
            issue.screenshot = path
            await info.attach(`${issue.rule} (${issue.impact})`, { contentType: 'image/png', path })
          } catch (e: unknown) {
            const body = typeof e === 'string' ? e : e instanceof Error ? e.message : 'Unknown error'
            await info.attach(`Error: ${issue.rule} (${issue.impact})`, { contentType: 'text/plain', body })
          }
        }
        issues.push(issue)
      }
    }

    const parser = new Parser({ header })
    const csv = parser.parse(issues)
    return csv + '\n'
  }
}

const getScreenshotPath = (issue: Issue, slug: string) => {
  const { rule, impact, target } = issue
  const hash = typeof target === 'string' ? shake(target) : shake(new Date().toISOString())
  return `${slug.substr(0, 15)}-${impact}-${rule}-${hash}.png`
}

/**
 * Counts the number of violations in each severity category
 *
 * @param   {axe.AxeResults} res      The Axe analyzer results
 * @param   {string}         severity One of: critical, serious, moderate, or minor
 * @returns {number}                  The number of violations in that category
 */
export const getViolationCountBySeverity = (res: axe.AxeResults, severity: string): number => {
  const violations = res.violations.filter(v => v.impact === severity)
  return violations.reduce((t, v) => t + v.nodes.length, 0)
}

/**
 * Creates a unique hash from a CSS target. Intended to be used to create filenames for screenshots.
 *
 * @param   {string} val The value to be hashed
 * @returns {string}     A likely unique hashed value
 */
const shake = (val: string) => createHash('shake256', { outputLength: 4 }).update(val).digest('hex')
