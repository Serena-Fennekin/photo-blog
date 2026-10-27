import { defineConfig, devices } from '@playwright/test'
import { delimiter, dirname, resolve } from 'node:path'

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: 'local-publishing.spec.ts',
  workers: 2,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://127.0.0.1:3132',
    channel: 'chrome',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: `"${process.execPath}" node_modules/nuxt/bin/nuxt.mjs dev --host 127.0.0.1 --port 3132`,
    url: 'http://127.0.0.1:3132/api/public/home',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: { PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}`, JOURNAL_BUILD_DIR: resolve('.superpowers/public-e2e/nuxt'), JOURNAL_DATA_DIR: resolve('.superpowers/public-e2e/data'), JOURNAL_MEDIA_DIR: resolve('.superpowers/public-e2e/storage'), JOURNAL_REPOSITORY: 'fixture' }
  }
})
