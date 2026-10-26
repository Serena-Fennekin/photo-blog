import { expect, test } from '@playwright/test'

test('browses the public journal across themes, gallery filters, stories, and about', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '日常，经过光之后' })).toBeVisible()
  await expect(page.locator('[data-home-motion-root]')).toHaveAttribute('data-motion-mode', 'animated')
  await expect(page.locator('[data-home-motion="chapter-date"]')).toHaveCount(2)
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
  await page.getByRole('link', { name: /翻阅这组记录/ }).first().click()
  await expect(page.getByRole('heading', { name: '冬日侧光', level: 1 })).toBeVisible()
  await expect(curtain).toHaveAttribute('data-state', 'idle')
  await expect(page.locator('[data-story-photo-id]')).toHaveCount(3)
  const imageAlts = await page.locator('main img').evaluateAll(images => images.map(image => image.getAttribute('alt')))
  expect(imageAlts.every(alt => alt !== null)).toBe(true)
  await page.locator('[data-story-photo-id]').first().getByRole('button').click()
  await expect(page.getByRole('dialog', { name: '照片详情' })).toBeVisible()
  await page.getByRole('button', { name: /关闭/ }).click()
  await expect(page.getByRole('dialog', { name: '照片详情' })).toBeHidden()

  const aboutNavigation = page.getByRole('link', { name: '关于我' }).click()
  await expect(curtain).not.toHaveAttribute('data-state', 'idle')
  await aboutNavigation
  await expect(page.getByRole('heading', { name: '关于我', level: 1 })).toBeVisible()
  await expect(curtain).toHaveAttribute('data-state', 'idle')
})

test('keeps all homepage content visible with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  await expect(page.locator('[data-home-motion-root]')).toHaveAttribute('data-motion-mode', 'static')
  await expect(page.getByRole('heading', { name: '日常，经过光之后' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '冬日侧光' })).toBeVisible()
  await expect(page.getByRole('link', { name: /进入摄影集/ })).toBeVisible()
})
