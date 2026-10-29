import { chromium } from '@playwright/test'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
const browser = await chromium.launch({ channel: 'chrome' })
const results = []
const output=resolve(process.argv[2] || '.superpowers/iris-performance/results.json')
try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 3840, height: 2160 }]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
    await page.goto('http://127.0.0.1:3000/')
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
    await page.getByRole('button', { name: '浅色', exact: true }).click()
    await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '摄影集', exact: true }).click()
    await page.locator('[data-route-curtain][data-state="idle"]').waitFor({ state: 'attached' })
    const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable')
    for (const scenario of ['normal', 'without-iris', 'without-ambient']) {
      const toggle = page.getByRole('button', { name: '背景特效', exact: true })
      const on = await toggle.getAttribute('aria-pressed') === 'true'
      if (on === (scenario === 'without-ambient')) await toggle.click()
      const style = scenario === 'without-iris' ? await page.addStyleTag({ content: '.aperture-screen,.aperture-canvas {visibility:hidden!important}' }) : null
      for (let run = 0; run < 2; run++) {
        await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '首页', exact: true }).click()
        await page.waitForURL('http://127.0.0.1:3000/')
        await page.locator('.home-page').waitFor()
        const before = (await cdp.send('Performance.getMetrics')).metrics
        const sample = await page.evaluate(() => new Promise(resolve => {
          const values = []; let last = 0, started = false, complete = false
          const curtain = document.querySelector('[data-route-curtain]')
          const finish = () => { if (complete) return; complete = true; observer.disconnect(); resolve(values) }
          const observer = new MutationObserver(() => {
            if (curtain.dataset.state === 'revealing' && !started) { started = true; last = performance.now() }
            if (started && curtain.dataset.state === 'idle') finish()
          })
          observer.observe(curtain, { attributes: true, attributeFilter: ['data-state'] })
          const tick = now => {
            if (complete) return
            if (started) {
              if (last && now > last) values.push(now - last)
              last = now; started = true
            }
            requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          document.querySelector('.site-nav a[href="/gallery"]').click()
          setTimeout(finish, 5000)
        }))
        const after = (await cdp.send('Performance.getMetrics')).metrics
        const sorted = [...sample].sort((a,b) => a-b)
        const metrics = Object.fromEntries(['LayoutDuration','RecalcStyleDuration','ScriptDuration','TaskDuration'].map(name => [name, +(1000 * (after.find(m=>m.name===name).value - before.find(m=>m.name===name).value)).toFixed(1)]))
        const record = { viewport, scenario, run, frames: sample.length, mean: sample.length ? +(sample.reduce((a,b)=>a+b,0)/sample.length).toFixed(2) : null, p95: sample.length ? +sorted[Math.floor(sorted.length*.95)].toFixed(2) : null, max: sample.length ? +Math.max(...sample).toFixed(2) : null, metrics }
        results.push(record); console.log(JSON.stringify(record))
      }
      if (style) await style.evaluate(node => node.remove())
    }
    await page.close()
  }
  await mkdir(dirname(output),{recursive:true}); await writeFile(output, JSON.stringify(results,null,2)); console.log(JSON.stringify(results))
} finally { await browser.close() }
