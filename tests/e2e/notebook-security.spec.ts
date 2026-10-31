import { expect, test, type Page } from '@playwright/test'
async function login(page: Page) {
  await page.goto('/admin/login')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
  await page.getByLabel('用户名', { exact: true }).fill('local-e2e-owner')
  await page.getByLabel('密码', { exact: true }).fill('Only-for-isolated-tests-2026!')
  await page.getByRole('button', { name: /创建账号并进入|^登录$/ }).click()
  await expect(page.getByRole('heading', { name: '照片管理' })).toBeVisible()
}
test('does not overwrite stored copy after loading fails and allows a safe retry', async ({ page }) => {
  await login(page)
  const original = await (await page.request.get('/api/admin/site-content')).json()
  await page.request.put('/api/admin/site-content', { data: { homeQuote: '这段文字必须保留' } })
  let blocked = true
  await page.route('**/api/admin/site-content', route => route.request().method() === 'GET' && blocked ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ statusMessage: 'Temporary failure' }) }) : route.continue())
  try {
    await page.getByRole('link', { name: '文案设置', exact: true }).click()
    await expect(page.getByRole('button', { name: '保存网站文案' })).toBeDisabled({ timeout: 3000 })
    await expect(page.getByRole('alert')).toContainText('加载')
    blocked = false
    await page.getByRole('button', { name: '重新加载文案' }).click()
    await expect(page.getByLabel('首页引言', { exact: true })).toHaveValue('这段文字必须保留')
    await page.getByLabel('作者名称', { exact: true }).fill('安全修改')
    await page.getByRole('button', { name: '保存网站文案' }).click()
    await expect(page.locator('.admin-notices[role=status]')).toContainText('文案已保存')
    expect((await (await page.request.get('/api/admin/site-content')).json()).homeQuote).toBe('这段文字必须保留')
  } finally { await page.request.put('/api/admin/site-content', { data: original }) }
})

test('shares one first-visit identity across concurrent visible cards and refreshes', async ({ page, browser }) => {
  await login(page)
  const ids: string[] = []
  for (const body of ['并发访客检查A', '并发访客检查B']) {
    const result = await page.request.post('/api/admin/posts', { data: { title: '', body, topic: 'life', imageIds: [], status: 'published', visibility: 'public' } })
    ids.push((await result.json()).id)
  }
  const visitor = await browser.newContext({ viewport: { width: 1280, height: 1200 } }), front = await visitor.newPage()
  let release!: () => void, started = 0
  const barrier = new Promise<void>(resolve => { release = resolve })
  await front.route('**/api/public/posts/*/view', async route => { started++; if (started <= 2) { if (started === 2) release(); await barrier } await route.continue() })
  try {
    expect((await visitor.cookies()).some(cookie => cookie.name === 'journal_visitor')).toBe(false)
    await front.goto('/about')
    for (const id of ids) await expect(front.locator(`[data-post-id="${id}"] [data-post-views]`)).toHaveText('1 次浏览')
    await front.reload()
    await front.waitForTimeout(1800)
    for (const id of ids) expect((await (await page.request.get('/api/admin/posts/' + id)).json()).viewCount).toBe(1)
  } finally { release(); await visitor.close(); for (const id of ids) await page.request.delete('/api/admin/posts/' + id) }
})

test('waits until the about curtain has cleared before recording visible posts', async ({ page, browser }) => {
  await login(page)
  const result = await page.request.post('/api/admin/posts', { data: { title: '', body: '遮罩可见性检查', topic: 'life', imageIds: [], status: 'published', visibility: 'public' } })
  const id = (await result.json()).id
  const visitor = await browser.newContext({ viewport: { width: 1280, height: 1200 } }), front = await visitor.newPage()
  let requests = 0
  front.on('request', request => { if (request.url().includes(`/api/public/posts/${id}/view`)) requests++ })
  try {
    await front.goto('/')
    await expect(front.locator('html')).toHaveAttribute('data-app-ready', 'true')
    await front.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '关于我', exact: true }).click()
    await expect(front.locator(`[data-post-id="${id}"]`)).toBeVisible()
    await expect(front.locator('[data-route-curtain]')).toHaveAttribute('data-state', 'revealing')
    await front.waitForTimeout(1200)
    expect(requests).toBe(0)
    await expect(front.locator('[data-route-curtain]')).toHaveAttribute('data-state', 'idle')
    await expect(front.locator(`[data-post-id="${id}"] [data-post-views]`)).toHaveText('1 次浏览')
  } finally { await visitor.close(); await page.request.delete('/api/admin/posts/' + id) }
})
