import { expect, test } from '@playwright/test'
import sharp from 'sharp'
import { irisBundle } from './helpers/iris-bundle'
import { routeFixtureImages } from './helpers/fixture-images'

test.beforeEach(async ({ page }) => {
  await routeFixtureImages(page)
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
})

test('transparent iris pixels preserve destination colors in the browser compositor', async ({ page }) => {
  await page.addScriptTag({ content: await irisBundle() })
  for (const mode of ['auto', '2d']) {
    for (const dark of [false, true]) {
      await page.evaluate(({ mode, dark }) => {
        const renderer = (window as any).IrisTest.createIrisRenderer(mode)
        if (!renderer) throw new Error('Renderer unavailable')
        ;(window as any).compositeRenderer = renderer
        const stage = document.createElement('div')
        stage.id = 'composite-stage'
        stage.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgb(32,64,96)'
        renderer.canvas.style.cssText = 'width:100%;height:100%;display:block'
        stage.append(renderer.canvas)
        document.body.append(stage)
        renderer.resize(innerWidth, innerHeight)
        renderer.draw(1, dark ? { tip: '#14241d', face: '#35443b', edge: '#1d2d24' } : undefined)
      }, { mode, dark })
      const image = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      const index = (Math.floor(image.info.height / 2) * image.info.width + Math.floor(image.info.width / 2)) * image.info.channels
      const pixel = [...image.data.subarray(index, index + 3)]
      expect(pixel, `${mode}, dark=${dark}: transparent canvas must not add light`).toEqual([32, 64, 96])
      await page.evaluate(() => { (window as any).compositeRenderer.dispose(); document.querySelector('#composite-stage')!.remove() })
    }
  }
})

test('GPU iris emits transparent black for cleared areas across compositing backends', async ({ page }) => {
  await page.addScriptTag({ content: await irisBundle() })
  const pixels = await page.evaluate(() => {
    const renderer = (window as any).IrisTest.createIrisRenderer()
    if (!renderer || renderer.kind !== 'webgl') throw new Error('GPU regression needs WebGL')
    try {
      renderer.resize(3840, 2160)
      const gl = renderer.canvas.getContext('webgl')!
      return [.5, .95, 1].map(time => {
        renderer.draw(time)
        const pixel = new Uint8Array(4)
        gl.readPixels(Math.floor(renderer.canvas.width / 2), Math.floor(renderer.canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
        return [...pixel]
      })
    } finally { renderer.dispose() }
  })
  expect(pixels).toEqual([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]])
})

test('photo details still cover the shared navigation', async ({ page }) => {
  await page.goto('/gallery?photo=winter-1')
  const dialog = page.getByRole('dialog', { name: '照片详情' })
  await expect(dialog).toBeVisible()
  const covered = await page.evaluate(() => {
    const link = document.querySelector('.site-shell > .site-header a[href="/about"]')!
    const box = link.getBoundingClientRect()
    return document.querySelector('.photo-lightbox')!.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
  })
  expect(covered).toBe(true)
})

test('about navigation keeps one uncovered, stationary header from click through completion', async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({ width: 2560, height: 1271 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/gallery')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true')
  await page.evaluate(() => document.fonts.ready)
  const samples = await page.evaluate(async () => {
    const frames: { x: number; exposed: boolean; ghostHeader: boolean }[] = []
    let stop = false
    const tick = () => {
      const header = document.querySelector('.site-shell > .site-header')!
      const link = header.querySelector<HTMLAnchorElement>('a[href="/about"]')!
      const box = link.getBoundingClientRect()
      const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      const cloneHeader = document.querySelector('.cycling-source-content .site-header')
      const cloneBox = cloneHeader?.getBoundingClientRect()
      frames.push({ x: box.x, exposed: header.contains(top), ghostHeader: Boolean(cloneHeader && cloneBox && cloneBox.bottom > 0 && getComputedStyle(cloneHeader).visibility !== 'hidden') })
      if (!stop) requestAnimationFrame(tick)
    }
    tick()
    document.querySelector<HTMLAnchorElement>('.site-shell > .site-header a[href="/about"]')!.click()
    await new Promise<void>(resolve => {
      const curtain = document.querySelector('[data-route-curtain]')!
      let active = false
      const observer = new MutationObserver(() => {
        if (curtain.getAttribute('data-state') !== 'idle') active = true
        if (active && curtain.getAttribute('data-state') === 'idle') { observer.disconnect(); resolve() }
      })
      observer.observe(curtain, { attributes: true, attributeFilter: ['data-state'] })
    })
    stop = true
    return frames
  })
  expect(samples.length).toBeGreaterThan(10)
  expect(samples.every(frame => frame.exposed), 'navigation must stay above the animated snapshot').toBe(true)
  expect(samples.some(frame => frame.ghostHeader), 'the old navigation must not be repainted over the current navigation').toBe(false)
  const positions = samples.map(frame => frame.x)
  expect(Math.max(...positions) - Math.min(...positions), 'scrollbar changes must not shift navigation').toBeLessThanOrEqual(1)
})
