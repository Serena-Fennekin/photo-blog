import { expect, test } from '@playwright/test'
import sharp from 'sharp'
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
  await expect(page.getByRole('heading', { name: /有些片刻没有故事/ })).toBeVisible()
  await expect(page.locator('[data-home-motion-root]')).toHaveAttribute('data-motion-mode', 'animated')
  await expect(page.locator('[data-featured-photo-id]')).toHaveCount(0)
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

  await page.goto('/gallery?photo=winter-1')
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
  const aboutTitle = await page.locator('.about-page h1').evaluate(node => parseFloat(getComputedStyle(node).fontSize))
  const aboutStatement = await page.locator('.about-page__statement').evaluate(node => parseFloat(getComputedStyle(node).fontSize))
  expect(aboutTitle).toBeGreaterThan(aboutStatement)
  await expect(page.locator('.about-page__body')).toContainText('骑行')
  await expect(page.locator('.about-page__body')).toContainText('谢谢你')
  await expect(page.locator('.about-page__footer')).toHaveCount(0)
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
  await expect(page.getByRole('heading', { name: /有些片刻没有故事/ })).toBeVisible()
  await expect(page.locator('.home-featured, .home-about')).toHaveCount(0)
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
  expect(await page.locator('.gallery-heading h1').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeLessThanOrEqual(104)
  expect(await page.locator('.gallery-heading > p').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(18)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('keeps the homepage to its quotation and larger gallery entrance', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
  await expect(page.locator('.home-page > *').first()).toHaveClass('gallery-invitation')
  await expect(page.locator('main h1')).toHaveCount(1)
  await expect(page.locator('.home-hero')).toHaveCount(0)
  await expect(page.locator('.home-page > section')).toHaveCount(1)
  await expect(page.locator('.home-featured, .home-about, .gallery-invitation__note')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /进入摄影集/ })).toHaveCSS('font-size', '20px')
  await expect(page.locator('body')).not.toContainText(/\u676d\u5dde|hang[\s_-]*zhou/i)
  await expect(page.locator('.site-footer__registration')).toHaveText('备案信息待更新')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('places the shared footer at the document bottom on home, gallery and about', async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({ width: 1236, height: 1244 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of ['/', '/gallery', '/about']) {
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
    const geometry = await page.locator('.site-footer').evaluate(node => ({ bottom: node.getBoundingClientRect().bottom + scrollY, documentBottom: Math.max(document.documentElement.scrollHeight, innerHeight), position: getComputedStyle(node).position }))
    expect(Math.abs(geometry.bottom - geometry.documentBottom)).toBeLessThanOrEqual(2)
    expect(geometry.position).not.toBe('fixed')
  }
})

test('opens the gallery from a closed iris below navigation while ambient motion continues', async ({ page }) => {
  test.setTimeout(60_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  // Keep the iris closed until the destination is ready, then reveal the photographs progressively.
  await page.evaluate(() => {
    const router = (document.querySelector('#__nuxt') as any).__vue_app__.config.globalProperties.$router
    let first = true
    router.beforeResolve(async (to: { path: string }) => {
      if (to.path === '/gallery' && first) { first = false; await new Promise(resolve => setTimeout(resolve, 2700)) }
    })
  })
  for (const theme of ['深色', '浅色']) {
    await page.getByRole('button', { name: theme }).click()
    const navigation = page.getByRole('link', { name: /进入摄影集/ }).click()
    const iris = page.locator('.aperture-scene')
    await expect(iris).toBeVisible()
    const faceBrightness = await iris.locator('.iris-metal-face').evaluate(node => (getComputedStyle(node).stopColor.match(/[\d.]+/g) ?? []).slice(0, 3).reduce((sum, value) => sum + Number(value), 0))
    if (theme === '深色') expect(faceBrightness).toBeLessThan(220)
    else expect(faceBrightness).toBeGreaterThan(600)
    await expect(page.locator('.camera-scene')).toHaveCount(0)
    await expect(page.locator('[data-ambient-background]')).toHaveAttribute('data-running', 'true')
    const header = page.locator('.site-header'), curtain = page.locator('[data-route-curtain]')
    expect((await curtain.boundingBox())!.y).toBeGreaterThanOrEqual((await header.boundingBox())!.height)
    await expect(curtain).toHaveCSS('pointer-events', 'none')
    if (theme === '深色') {
      await expect(iris).toHaveAttribute('data-aperture-phase', 'covered')
      await page.waitForTimeout(1800)
      await expect(iris).toHaveAttribute('data-aperture-phase', 'covered')
      const painted = await sharp(await iris.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      const shades = [.15, .45, .8].flatMap(x => [.15, .45, .8].map(y => painted.data[(Math.floor(y * painted.info.height) * painted.info.width + Math.floor(x * painted.info.width)) * painted.info.channels]!))
      expect(Math.max(...shades) - Math.min(...shades)).toBeGreaterThan(4)
      if (process.env.IRIS_VISUAL) await page.screenshot({ path: '.superpowers/iris-preview/live-closed.png' })
    }
    await navigation
    await expect(page).toHaveURL(/\/gallery$/)
    await expect(iris).toHaveAttribute('data-aperture-phase', 'revealing')
    if (process.env.IRIS_VISUAL) {
      await iris.evaluate(node => node.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 380 }))
      await page.screenshot({ path: `.superpowers/iris-preview/live-${theme}-380.png` })
    }
    await expect(page.getByRole('heading', { name: '摄影集', exact: true })).toBeVisible()
    await page.locator('[data-photo-id="winter-1"]').click()
    await expect(page.getByRole('dialog', { name: '照片详情' })).toBeVisible()
    await page.getByRole('button', { name: /关闭/ }).click()
    await expect(page.locator('[data-route-curtain]')).toHaveAttribute('data-state', 'idle')
    await expect(iris).toHaveCount(0)
    await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '首页', exact: true }).click()
  }
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '关于我', exact: true }).click()
  await expect(page.locator('[data-route-curtain]')).toHaveAttribute('data-state', 'revealing')
  await expect(page.locator('[data-ambient-background]')).toHaveAttribute('data-running', 'true')
  await expect(page.locator('.cycling-ambient')).toBeVisible()
  await expect(page.locator('[data-route-curtain]')).toHaveAttribute('data-state', 'idle')
  expect(errors).toEqual([])
})

test('iris blades cover without a central hole and fully clear wide, square and portrait views', async ({ page }) => {
  test.setTimeout(60_000)
  // A retained DOM specimen allows exact CSS-frame checks without extending the real router timer.
  await page.evaluate(() => {
    new MutationObserver((_records, observer) => {
      const scene = document.querySelector('.aperture-scene')
      if (!scene) return
      const probe = document.createElement('div')
      probe.id = 'iris-geometry-probe'; probe.setAttribute('aria-hidden', 'true')
      probe.style.cssText = 'position:fixed;inset:72px 0 0;pointer-events:none;z-index:2000'
      const specimen = scene.cloneNode(true) as HTMLElement
      const ids = new Map<string, string>()
      specimen.querySelectorAll('[id]').forEach(element => { const old = element.id; ids.set(`url(#${old})`, `url(#${old}-probe)`); element.id = `${old}-probe` })
      specimen.querySelectorAll('[fill],[clip-path]').forEach(element => {
        for (const attribute of ['fill', 'clip-path']) {
          const value = element.getAttribute(attribute)
          if (value && ids.has(value)) element.setAttribute(attribute, ids.get(value)!)
        }
      })
      specimen.setAttribute('data-aperture-phase', 'revealing')
      probe.append(specimen); document.body.append(probe); observer.disconnect()
    }).observe(document.body, { childList: true, subtree: true })
  })
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '摄影集', exact: true }).click()
  const probe = page.locator('#iris-geometry-probe')
  await expect(probe).toBeAttached()
  try {
    for (const viewport of [{ width: 2560, height: 1440 }, { width: 1000, height: 1000 }, { width: 393, height: 852 }]) {
      await page.setViewportSize(viewport)
      const coverage = await probe.evaluate(node => {
        const svg = node.querySelector('svg')!, leaves = [...node.querySelectorAll<SVGPathElement>('.iris-leaf')]
        const windows = [...node.querySelectorAll<SVGPathElement>('.iris-window')], cap = node.querySelector<SVGCircleElement>('.iris-tipcap')
        const animations = node.getAnimations({ subtree: true }); animations.forEach(animation => animation.pause())
        const bounds = node.getBoundingClientRect()
        const inside = (leaf: SVGGeometryElement, x: number, y: number) => {
          const point = svg.createSVGPoint(); point.x = bounds.left + bounds.width * x; point.y = bounds.top + bounds.height * y
          return leaf.isPointInFill(point.matrixTransform(leaf.getScreenCTM()!.inverse()))
        }
        const covered = (x: number, y: number) => Boolean(cap && Number(getComputedStyle(cap).opacity) > .5 && inside(cap, x, y)) || leaves.some((leaf, index) => inside(leaf, x, y) && (!windows[index] || inside(windows[index]!, x, y)))
        const sample = (time: number) => {
          animations.forEach(animation => { animation.currentTime = time })
          const points = [.01, .25, .5, .75, .99].flatMap(x => [.01, .25, .5, .75, .99].map(y => covered(x, y)))
          return { center: covered(.5, .5), covered: points.filter(Boolean).length }
        }
        const closed = sample(0)
        animations.forEach(animation => { animation.currentTime = 180 })
        const rim = Array.from({ length: 72 }, (_, index) => covered(.5 + Math.cos(index * Math.PI / 36) * .46, .5 + Math.sin(index * Math.PI / 36) * .46))
        return { closed, rim, middle: sample(550), open: sample(1100) }
      })
      expect(coverage.closed).toEqual({ center: true, covered: 25 })
      expect(coverage.rim.every(Boolean)).toBe(true)
      expect(coverage.middle.center).toBe(false)
      expect(coverage.middle.covered).toBeGreaterThan(0)
      expect(coverage.middle.covered).toBeLessThan(25)
      expect(coverage.open).toEqual({ center: false, covered: 0 })
    }
    if (process.env.IRIS_VISUAL) {
      await page.setViewportSize({ width: 1280, height: 900 })
      for (const theme of ['浅色', '深色']) {
        await page.getByRole('button', { name: theme, exact: true }).click()
        for (const time of [0, 380, 700, 1100]) {
          await probe.evaluate((node, frame) => node.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = frame }), time)
          await page.screenshot({ path: `.superpowers/iris-preview/${theme}-${time}.png` })
        }
      }
    }
  } finally { await probe.evaluate(node => node.remove()) }
})

test('switches decorative backgrounds without blocking navigation and persists the visitor choice', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const toggle = page.getByRole('button', { name: '背景特效', exact: true })
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-ambient-background]')).toHaveAttribute('data-running', 'true')
  await page.getByRole('button', { name: '深色', exact: true }).click()
  await expect(page.locator('[data-ambient-background]')).toHaveAttribute('data-scene', 'night')
  await page.getByRole('button', { name: '浅色', exact: true }).click()
  await expect(page.locator('[data-ambient-background]')).toHaveAttribute('data-scene', 'pond')
  await page.mouse.move(80, 330)
  await page.mouse.move(260, 460, { steps: 12 })
  await page.waitForTimeout(120)
  await toggle.click()
  await expect(page.locator('[data-ambient-background]')).toHaveAttribute('data-running', 'false')
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(page.locator('[data-ambient-background]')).toHaveAttribute('data-running', 'true')
  expect(await page.locator('[data-ambient-background]').evaluate(node => getComputedStyle(node).pointerEvents)).toBe('none')
  expect(errors).toEqual([])
})

test('uses more of a large monitor and lets categories scroll clear of photographs', async ({ page, isMobile }) => {
  if (!isMobile) {
    await page.setViewportSize({ width: 2560, height: 1440 })
    await page.goto('/about')
    expect((await page.locator('.about-page').boundingBox())!.width).toBeGreaterThanOrEqual(1800)
    expect(await page.locator('.about-page__body').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(20)
    expect(await page.locator('[data-ambient-background]').evaluate((node: HTMLCanvasElement) => node.width * node.height)).toBeLessThanOrEqual(2510000)
  }
  await page.goto('/gallery')
  const grid = page.locator('.gallery-grid')
  if (!isMobile) expect((await grid.boundingBox())!.width).toBeGreaterThanOrEqual(1800)
  const filter = page.locator('.category-filter')
  await filter.scrollIntoViewIfNeeded()
  const y = await filter.evaluate(node => node.getBoundingClientRect().bottom + scrollY + 500)
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y)
  await expect.poll(() => filter.evaluate(node => node.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
