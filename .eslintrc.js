/**
 * Global ESLint settings.
 */
module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
  },
  /**
   * The order is significant => later overrides previous
   */
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:playwright/playwright-test',
    'standard',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  /**
   * Rules override configs from `extends` section above
   */
  rules: {}
}
