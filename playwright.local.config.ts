import { defineConfig, devices } from '@playwright/test'
import { delimiter, dirname, resolve } from 'node:path'

export default defineConfig({
  testDir: './tests/e2e', testMatch: ['local-publishing.spec.ts', 'notebook-publishing.spec.ts', 'notebook-security.spec.ts', 'workspace-ui.spec.ts','workspace-states.spec.ts'], workers: 1, timeout: 90000,
  expect: { timeout: 15000 },
  use: { baseURL: 'http://127.0.0.1:3131', channel: 'chrome', trace: 'retain-on-failure', ...devices['Desktop Chrome'] },
  webServer: {
    command: `"${process.execPath}" node_modules/nuxt/bin/nuxt.mjs dev --host 127.0.0.1 --port 3131`,
    url: 'http://127.0.0.1:3131/api/admin/auth/state', reuseExistingServer: !process.env.CI, timeout: 180000,
    env: { PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}`, JOURNAL_BUILD_DIR: resolve('.superpowers/local-e2e/nuxt'), JOURNAL_DATA_DIR: resolve('.superpowers/local-e2e/data'), JOURNAL_MEDIA_DIR: resolve('.superpowers/local-e2e/storage'), JOURNAL_SEED: 'false' }
  }
})
