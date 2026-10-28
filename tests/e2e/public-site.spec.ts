import { expect, test } from '@playwright/test'
import { routeFixtureImages } from './helpers/fixture-images'

test.beforeEach(async ({ page }) => {
  await routeFixtureImages(page)
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
})

test('browses the public journal across themes, gallery filters, photo links, and about', async ({ page }) => {
  // Allow cold development chunk compilation plus three intentional route curtains.
  test.setTimeout(60_000)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /看见喜欢的，\s*就拍下来。/ })).toBeVisible()
  await expect(page.locator('[data-home-motion-root]')).toHaveAttribute('data-motion-mode', 'animated')
  await expect(page.locator('[data-featured-photo-id]')).toHaveCount(4)
  const curtain = page.locator('[data-route-curtain]')
  await expect(curtain).toHaveAttribute('data-state', 'idle')

  for (const [name, theme] of [['深色', 'dark'], ['浅色', 'light'], ['跟随系统', 'system']] as const) {
    await page.getByRole('button', { name }).click()
    await expect(page.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
    if (theme !== 'system') await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  }

  const galleryNavigation = page.getByRole('link', { name: /进入摄影集/ }).click()
  await expect(curtain).not.toHaveAttribute('data-state', 'idle')
  await galleryNavigation
  await expect(page).toHaveURL(/\/gallery$/)
  await expect(page.getByRole('heading', { name: '摄影集', level: 1 })).toBeVisible()
  await expect(curtain).toHaveAttribute('data-state', 'idle')
  await page.getByRole('link', { name: '自然' }).click()
  await expect(page).toHaveURL(/category=nature/)
  await expect(page.locator('[data-photo-id^="winter-"]')).toHaveCount(3)
  await expect(page.locator('[data-photo-id^="river-"]')).toHaveCount(0)

  await page.goto('/')
  await page.getByRole('link', { name: /在摄影集中查看/ }).first().click()
  await expect(page).toHaveURL(/\/gallery\?photo=winter-1/)
  await expect(curtain).toHaveAttribute('data-state', 'idle')
  await expect(page.locator('[data-photo-id^="winter-"]')).toHaveCount(3)
  const imageAlts = await page.locator('main img').evaluateAll(images => images.map(image => image.getAttribute('alt')))
  expect(imageAlts.every(alt => alt !== null)).toBe(true)
  await expect(page.getByRole('dialog', { name: '照片详情' })).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(0)
  await page.getByRole('button', { name: /关闭/ }).click()
  await expect(page.getByRole('dialog', { name: '照片详情' })).toBeHidden()

  const aboutNavigation = page.getByRole('link', { name: '关于我' }).click()
  await expect(curtain).not.toHaveAttribute('data-state', 'idle')
  await aboutNavigation
  await expect(page.getByRole('heading', { name: '关于我', level: 1 })).toBeVisible()
  await expect(curtain).toHaveAttribute('data-state', 'idle')
})

test('opens legacy record bookmarks in the gallery', async ({ page }) => {
  await page.goto('/stories/winter-light')
  await expect(page).toHaveURL(/\/gallery$/)
  await expect(page.getByRole('heading', { name: '摄影集', level: 1 })).toBeVisible()
})

test('keeps all homepage content visible with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  await expect(page.locator('[data-home-motion-root]')).toHaveAttribute('data-motion-mode', 'static')
  await expect(page.getByRole('heading', { name: /看见喜欢的，\s*就拍下来。/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: '随手挑了几张' })).toBeVisible()
  await expect(page.getByRole('link', { name: /进入摄影集/ })).toBeVisible()
})

test('keeps the enlarged navigation and category labels readable on the viewport', async ({ page }) => {
  await page.goto('/gallery')
  const navigation = page.getByRole('navigation', { name: '主导航' })
  for (const name of ['首页', '摄影集', '关于我']) {
    const link = navigation.getByRole('link', { name, exact: true })
    await expect(link).toHaveCSS('font-size', '20px')
    await expect(link).toBeInViewport()
  }
  await expect(page.locator('[data-category="nature"]')).toHaveCSS('font-size', '18px')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('places the invitation second and centers finite featured photos on mobile, with two columns on desktop', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
  await expect(page.locator('.home-page > *').nth(1)).toHaveClass('gallery-invitation')
  const grid = page.locator('.home-featured__grid')
  await expect(grid).toHaveCSS('column-count', isMobile ? '1' : '2')
  const cards = await page.locator('[data-featured-photo-id]').evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, center: (r.left + r.right) / 2 } }))
  expect(cards).toHaveLength(4)
  for (const card of cards) {
    expect(card.left).toBeGreaterThanOrEqual(0)
    expect(card.right).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
    if (isMobile) expect(Math.abs(card.center - page.viewportSize()!.width / 2)).toBeLessThan(2)
  }
  if (!isMobile) expect(new Set(cards.map(card => Math.round(card.left))).size).toBe(2)
  const text = page.locator('.home-featured__photo figcaption').first()
  const fits = await text.evaluate(element => { element.textContent = 'W'.repeat(1500); return element.scrollWidth <= element.clientWidth + 1 })
  expect(fits).toBe(true)
  await expect(page.locator('body')).not.toContainText(/\u676d\u5dde|hang[\s_-]*zhou/i)
  await expect(page.locator('.home-hero img')).toHaveCSS('object-fit', 'contain')
  await expect(page.locator('.home-hero img')).toHaveCSS('border-top-left-radius', '0px')
  if (isMobile) {
    const caption = await page.locator('.home-hero figcaption').boundingBox()
    const navigation = await page.getByRole('navigation', { name: '主导航' }).boundingBox()
    expect(caption!.y + caption!.height, 'hero caption must stay above the floating navigation').toBeLessThan(navigation!.y)
  }
})
