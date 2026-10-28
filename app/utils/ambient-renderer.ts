// Bounded decorative 2D scenes. No images, third-party code or network resources.
export const createAmbientRenderer = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')
  let width = 1, height = 1, theme: 'night' | 'pond' = 'pond'
  const stars = Array.from({ length: 80 }, (_, i) => ({ x: ((i * 127.731) % 997) / 997, y: ((i * 237.173) % 991) / 991, r: .55 + (i % 4) * .28 }))
  function resize() {
    width = innerWidth; height = innerHeight
    const ratio = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(2500000 / (width * height)))
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  function night(time: number) {
    if (!ctx) return
    for (const [i, star] of stars.entries()) {
      ctx.beginPath(); ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(202,221,224,${.18 + .26 * (1 + Math.sin(time * .0006 + i * 1.8)) / 2})`; ctx.fill()
    }
    for (let i = 0; i < 2; i++) {
      const phase = (time / 1000 + i * 6) % 15
      if (phase > 1.35) continue
      const x = width * (.92 - phase * .32), y = height * (.08 + i * .17) + phase * Math.min(height * .24, 150)
      const tailX = x + 100, tailY = y - 55
      const gradient = ctx.createLinearGradient(x, y, tailX, tailY)
      gradient.addColorStop(0, `rgba(204,230,233,${.55 * (1 - phase / 1.35)})`); gradient.addColorStop(1, 'rgba(204,230,233,0)')
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.strokeStyle = gradient; ctx.lineWidth = 1.3; ctx.stroke()
    }
  }
  function lily(x: number, y: number, radius: number, phase: number) {
    if (!ctx) return
    ctx.save(); ctx.translate(x, y); ctx.scale(1, .58); ctx.rotate(Math.sin(phase) * .08)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, radius, .22, Math.PI * 2 - .18); ctx.closePath()
    ctx.fillStyle = 'rgba(101,143,125,.16)'; ctx.fill(); ctx.strokeStyle = 'rgba(97,134,119,.18)'; ctx.lineWidth = 1; ctx.stroke()
    for (let i = 1; i <= 6; i++) { const angle = i * .88; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(angle) * radius * .88, Math.sin(angle) * radius * .88); ctx.stroke() }
    ctx.restore()
  }
  function bloom(x: number, y: number, time: number) {
    if (!ctx) return
    ctx.save(); ctx.translate(x, y + Math.sin(time * .0005) * 2)
    for (let i = 0; i < 8; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 4); ctx.beginPath(); ctx.ellipse(0, -8, 5.5, 14, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(181,133,143,.22)'; ctx.fill(); ctx.restore()
    }
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(186,154,100,.35)'; ctx.fill(); ctx.restore()
  }
  function pond(time: number) {
    if (!ctx) return
    // Most detail stays near the edges and lower half, leaving the reading area quiet.
    for (let i = 0; i < 6; i++) {
      const x = width * (i % 2 ? .92 : .07) + Math.sin(time * .00018 + i) * 5
      const y = height * (.40 + (i % 3) * .23)
      lily(x, y, 24 + i * 5, time * .00015 + i)
      if (i === 2 || i === 3) bloom(x + 12, y - 7, time)
    }
    for (let i = 0; i < 2; i++) {
      const t = time * .00010 + i * 3.1, x = width * (.5 + .31 * Math.sin(t)), y = height * (.72 + .14 * Math.sin(t * .62 + i))
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.cos(t) < 0 ? Math.PI + .16 : -.16); ctx.globalAlpha = .24
      ctx.fillStyle = i ? '#7d9b98' : '#c28f70'; ctx.beginPath(); ctx.ellipse(0, 0, 19, 6, 0, 0, Math.PI * 2); ctx.fill()
      const wag = Math.sin(time * .004 + i) * 4
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-29, -8 + wag); ctx.lineTo(-27, 8 + wag); ctx.closePath(); ctx.fill(); ctx.restore()
    }
    for (let i = 0; i < 12; i++) {
      const phase = (time * .00022 + i * .31) % 1, x = ((i * 147.3) % 997) / 997 * width, y = height * (.3 + ((i * 71) % 97) / 140)
      ctx.beginPath(); ctx.ellipse(x, y, 4 + phase * 48, 1 + phase * 13, 0, 0, Math.PI * 2); ctx.strokeStyle = `rgba(99,143,153,${.20 * (1 - phase)})`; ctx.lineWidth = .8; ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(116,145,154,.12)'; ctx.lineWidth = .75
    for (let i = 0; i < 36; i++) {
      const x = ((i * 117.37) % 997) / 997 * width, y = ((time * .10 + i * 71) % (height + 40)) - 20
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 13); ctx.stroke()
    }
  }
  resize()
  return {
    resize,
    setTheme(next: 'night' | 'pond') { theme = next },
    draw(time: number) { if (!ctx) return; ctx.clearRect(0, 0, width, height); theme === 'night' ? night(time) : pond(time) },
    clear() { ctx?.clearRect(0, 0, width, height) }
  }
}
