# Sample Electron Forge Project with Vite, TypeScript, Playwright, and Axe

This is a <abbr title="proof of concept">POC</abbr> sample project designed to verify that the following components can all be made to work together:

* Electron Forge: for converting web apps into multi-platform desktop apps
* Vite: fast build tool for transpiling the app during development (replaces Webpack)
* TypeScript: instead of JavaScript for cleaner tooling/development
* Playwright: test runner
* Axe: <abbr title="accessibility">a11y</abbr> testing library

## Quick Start

1. Clone this repo
2. `cd` into the project's root directory
3. `npm install`
4. `npm test`

Note: this project does NOT play nice with PNPM. I haven't tested with Yarn, but NPM definitely works.
