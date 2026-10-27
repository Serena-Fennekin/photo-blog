import { expect, test } from '@playwright/test'

test('opens from a deep gallery position and restores focus and scroll', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto('/gallery')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
  const card = page.locator('[data-photo-id="river-1"]')
  await expect(card).toBeEnabled()
  await card.evaluate(element => element.scrollIntoView({ block: 'center' }))
  await expect(card).toBeInViewport({ ratio: 0.8 })
  await card.evaluate(element => element.addEventListener('click', () => {
    element.setAttribute('data-click-scroll', String(window.scrollY))
  }, { once: true }))

  const detailResponse = page.waitForResponse(response => response.url().includes('/api/public/photos/river-1'))
  await card.click()
  expect((await detailResponse).status()).toBe(200)
  expect(pageErrors).toEqual([])
  const origin = Number(await card.getAttribute('data-click-scroll'))
  expect(origin).toBeGreaterThan(0)
  await expect(page).toHaveURL(/\?photo=river-1/)
  const dialog = page.getByRole('dialog', { name: '照片详情' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  expect(Number.parseFloat(await page.locator('body').evaluate(body => body.style.top))).toBeCloseTo(-origin, 0)
  await expect(dialog.getByText('SONY ILCE-7M4')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '照片详情' })).toBeHidden()
  await expect(card).toBeFocused()
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - origin)).toBeLessThan(2)
})

test('browser back closes the lightbox and missing photos return 404', async ({ page, request }) => {
  await page.goto('/gallery')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
  await page.locator('[data-photo-id="winter-1"]').click()
  await expect(page.getByRole('dialog', { name: '照片详情' })).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('dialog', { name: '照片详情' })).toBeHidden()

  const response = await request.get('/api/public/photos/missing-photo')
  expect(response.status()).toBe(404)
})

test('keeps enlarged camera metadata readable without a record-details link', async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({ width: 2560, height: 1295 })
  await page.goto('/gallery?photo=winter-3')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
  const dialog = page.getByRole('dialog', { name: '照片详情' })
  await expect(dialog.getByRole('link')).toHaveCount(0)
  const exif = dialog.getByRole('definition').first()
  await exif.scrollIntoViewIfNeeded()
  const typography = await dialog.locator('.exif-panel').evaluate(panel => ({
    label: parseFloat(getComputedStyle(panel.querySelector('dt')!).fontSize),
    value: parseFloat(getComputedStyle(panel.querySelector('dd')!).fontSize)
  }))
  expect(typography.label).toBeGreaterThanOrEqual(15)
  expect(typography.value).toBeGreaterThanOrEqual(18)
  await expect(dialog.getByText('2025-12-16 15:42')).toBeVisible()
})

test('fits portrait and landscape photos inside the viewer on large and resized screens', async ({ page, isMobile }) => {
  await page.route('https://images.unsplash.com/**', route => {
    const landscape = route.request().url().includes('photo-1483347756197-71ef80e95f73')
    return route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${landscape ? 2400 : 1600}" height="${landscape ? 1600 : 2400}"><rect width="100%" height="100%" fill="#67726c"/></svg>`
    })
  })
  const viewports = isMobile
    ? [{ width: 390, height: 844 }, { width: 530, height: 720 }]
    : [{ width: 2560, height: 1295 }, { width: 1280, height: 720 }]
  await page.setViewportSize(viewports[0]!)
  await page.goto('/gallery?photo=winter-3')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
  const dialog = page.getByRole('dialog', { name: '照片详情' })
  const image = dialog.locator('figure img')

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    for (const [photoId, ratio] of [['winter-3', 2 / 3], ['winter-2', 3 / 2]] as const) {
      if (photoId === 'winter-3') {
        if (await image.getAttribute('data-lightbox-photo-id') === 'winter-2') await dialog.getByRole('button', { name: '下一张' }).click()
      } else await dialog.getByRole('button', { name: '上一张' }).click()
      await expect(image).toHaveAttribute('data-lightbox-photo-id', photoId)
      await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true)
      const bounds = await image.evaluate(el => ({
        image: el.getBoundingClientRect().toJSON(),
        figure: el.closest('figure')!.getBoundingClientRect().toJSON(),
        viewport: { width: window.innerWidth, height: window.innerHeight }
      }))
      expect(bounds.image.height).toBeGreaterThan(0)
      expect(bounds.image.width / bounds.image.height).toBeCloseTo(ratio, 2)
      expect(bounds.image.top).toBeGreaterThanOrEqual(Math.max(0, bounds.figure.top) - 1)
      expect(bounds.image.left).toBeGreaterThanOrEqual(Math.max(0, bounds.figure.left) - 1)
      expect(bounds.image.bottom, `${photoId} must fit the available viewer height`).toBeLessThanOrEqual(Math.min(bounds.viewport.height, bounds.figure.bottom) + 1)
      expect(bounds.image.right).toBeLessThanOrEqual(Math.min(bounds.viewport.width, bounds.figure.right) + 1)
    }
  }
})
