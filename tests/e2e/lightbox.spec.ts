import { expect, test } from '@playwright/test'

test('opens from a deep gallery position and restores focus and scroll', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto('/gallery')
  const card = page.locator('[data-photo-id="river-1"]')
  await card.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => window.scrollY)

  const detailResponse = page.waitForResponse(response => response.url().includes('/api/public/photos/river-1'))
  await card.click()
  expect((await detailResponse).status()).toBe(200)
  expect(pageErrors).toEqual([])
  await expect(page).toHaveURL(/\?photo=river-1/)
  const dialog = page.getByRole('dialog', { name: '照片详情' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await expect(dialog.getByText('SONY ILCE-7M4')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '照片详情' })).toBeHidden()
  await expect(card).toBeFocused()
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThan(2)
})

test('browser back closes the lightbox and missing photos return 404', async ({ page, request }) => {
  await page.goto('/gallery')
  await page.locator('[data-photo-id="winter-1"]').click()
  await expect(page.getByRole('dialog', { name: '照片详情' })).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('dialog', { name: '照片详情' })).toBeHidden()

  const response = await request.get('/api/public/photos/missing-photo')
  expect(response.status()).toBe(404)
})
