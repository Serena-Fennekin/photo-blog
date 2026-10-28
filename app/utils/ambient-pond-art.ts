function sprite(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) paint(ctx)
  return canvas
}

export function createLeafSprite() {
  return sprite(200, 150, ctx => {
    ctx.translate(100, 80); ctx.scale(1, .65)
    const fill = ctx.createRadialGradient(-16, -15, 4, 0, 0, 88)
    fill.addColorStop(0, '#b4c892'); fill.addColorStop(.5, '#7ca777'); fill.addColorStop(1, '#4b7a64')
    ctx.beginPath(); ctx.moveTo(0, 5)
    for (let i = 0; i <= 80; i++) {
      const angle = .15 + i / 80 * (Math.PI * 2 - .4), radius = 78 + Math.sin(angle * 7) * 2.5 + Math.sin(angle * 11) * 1.1
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#73966f'; ctx.lineWidth = 1; ctx.stroke()
    for (let i = 0; i < 12; i++) {
      const angle = .45 + i * .49, x = Math.cos(angle) * 73, y = Math.sin(angle) * 73
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(x * .45 - y * .08, y * .45 + x * .08, x, y)
      ctx.strokeStyle = i % 2 ? 'rgba(220,236,177,.55)' : 'rgba(44,94,68,.28)'; ctx.lineWidth = .8; ctx.stroke()
      for (const portion of [.45, .7]) for (const side of [-1, 1]) {
        const a = angle + side * .2, r = 78 * Math.min(1, portion + .18)
        ctx.beginPath(); ctx.moveTo(x * portion, y * portion); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineWidth = .35; ctx.stroke()
      }
    }
    ctx.beginPath(); ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2); ctx.fillStyle = '#94b17d'; ctx.fill()
    for (const [x, y, radius] of [[-28, -19, 3], [31, 24, 2], [-9, 43, 1.5]]) {
      ctx.beginPath(); ctx.arc(x!, y!, radius!, 0, Math.PI * 2); ctx.fillStyle = 'rgba(235,249,239,.72)'; ctx.fill()
    }
  })
}

export function createLotusSprite() {
  return sprite(150, 150, ctx => {
    ctx.translate(75, 116)
    const petal = (angle: number, length: number, width: number, light: boolean) => {
      ctx.save(); ctx.rotate(angle)
      const gradient = ctx.createLinearGradient(0, -length, 0, 0)
      gradient.addColorStop(0, light ? '#e7b9d0' : '#d596b6'); gradient.addColorStop(.52, '#f0d8df'); gradient.addColorStop(1, '#bc859c')
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-width, -length * .2, -width * .7, -length * .66, 0, -length)
      ctx.bezierCurveTo(width * .55, -length * .66, width, -length * .2, 0, 0)
      ctx.fillStyle = gradient; ctx.fill(); ctx.strokeStyle = 'rgba(152,83,115,.5)'; ctx.lineWidth = .7; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(-width * .1, -length * .5, 0, -length * .92); ctx.strokeStyle = 'rgba(255,244,240,.7)'; ctx.stroke(); ctx.restore()
    }
    for (const angle of [-1.25, -.9, -.5, 0, .5, .9, 1.25]) petal(angle, 58, 23, false)
    for (const angle of [-.75, -.35, .12, .52]) petal(angle, 74, 17, true)
    for (const angle of [-.23, .22]) petal(angle, 85, 12, true)
    ctx.fillStyle = '#c7a35e'; ctx.beginPath(); ctx.ellipse(0, -8, 10, 5, 0, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#74906a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-8, 20, -4, 30); ctx.stroke()
  })
}

export function createPavilionSprite() {
  return sprite(360, 240, ctx => {
    ctx.strokeStyle = '#6f8174'; ctx.lineWidth = 3
    for (const x of [88, 148, 212, 272]) { ctx.beginPath(); ctx.moveTo(x, 108); ctx.lineTo(x, 204); ctx.stroke() }
    ctx.fillStyle = '#71877b'
    ctx.beginPath(); ctx.moveTo(20, 114); ctx.quadraticCurveTo(98, 118, 180, 54); ctx.quadraticCurveTo(263, 118, 340, 114); ctx.quadraticCurveTo(299, 141, 265, 132); ctx.lineTo(95, 132); ctx.quadraticCurveTo(61, 141, 20, 114); ctx.fill()
    ctx.fillStyle = '#91a299'; ctx.beginPath(); ctx.moveTo(88, 72); ctx.quadraticCurveTo(139, 66, 180, 16); ctx.quadraticCurveTo(222, 66, 272, 72); ctx.quadraticCurveTo(230, 89, 180, 75); ctx.quadraticCurveTo(130, 89, 88, 72); ctx.fill()
    ctx.beginPath(); ctx.moveTo(180, 16); ctx.lineTo(180, 6); ctx.stroke()
    ctx.lineWidth = 1; ctx.strokeStyle = '#c5cbb4'
    for (let i = 0; i < 13; i++) { const x = 72 + i * 18; ctx.beginPath(); ctx.moveTo(180, 58); ctx.quadraticCurveTo(x, 114, x, 130); ctx.stroke() }
    ctx.strokeStyle = '#7e8974'; ctx.lineWidth = 2; ctx.strokeRect(78, 179, 204, 23)
    for (let x = 90; x < 280; x += 16) { ctx.beginPath(); ctx.moveTo(x, 180); ctx.lineTo(x, 201); ctx.stroke() }
    ctx.fillStyle = '#84917c'; ctx.fillRect(62, 205, 236, 6); ctx.fillRect(52, 216, 256, 5)
  })
}

export function drawEgret(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha = .62
  ctx.lineCap = 'round'; ctx.strokeStyle = '#85896c'; ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.moveTo(-2, 9); ctx.lineTo(-4, 43); ctx.lineTo(4, 45); ctx.moveTo(9, 8); ctx.lineTo(18, 34); ctx.lineTo(12, 45); ctx.lineTo(21, 46); ctx.stroke()
  const feather = ctx.createLinearGradient(-16, -10, 15, 16); feather.addColorStop(0, '#fcfcf5'); feather.addColorStop(1, '#c3d1cd')
  ctx.fillStyle = feather; ctx.beginPath(); ctx.ellipse(0, 0, 25, 14, -.15, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-34, 8); ctx.lineTo(-20, 10); ctx.fill()
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-16, -4 + i * 2); ctx.quadraticCurveTo(4, 3 + i * 2, 13, 9 + i); ctx.strokeStyle = 'rgba(134,161,160,.45)'; ctx.lineWidth = .6; ctx.stroke() }
  const nod = Math.sin(time * .00035) * 1.5
  const neck = () => { ctx.beginPath(); ctx.moveTo(11, -3); ctx.bezierCurveTo(34, -14, 34, -29, 22, -39); ctx.bezierCurveTo(10, -52, 20, -68 + nod, 32, -65 + nod) }
  neck(); ctx.strokeStyle = '#a5b8b1'; ctx.lineWidth = 9; ctx.stroke()
  neck(); ctx.strokeStyle = '#f6f7ef'; ctx.lineWidth = 6.5; ctx.stroke()
  ctx.fillStyle = '#f5f7ee'; ctx.beginPath(); ctx.ellipse(34, -65 + nod, 9, 6.5, .12, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#b29e65'; ctx.beginPath(); ctx.moveTo(41, -67 + nod); ctx.lineTo(65, -61 + nod); ctx.lineTo(41, -62 + nod); ctx.fill()
  ctx.fillStyle = '#536964'; ctx.beginPath(); ctx.arc(37, -67 + nod, 1.3, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = .10; ctx.translate(0, 90); ctx.scale(1, -.55); ctx.fillStyle = '#c8d4c8'; ctx.beginPath(); ctx.ellipse(0, 0, 27, 13, 0, 0, Math.PI * 2); ctx.fill(); neck(); ctx.strokeStyle = '#ced8cd'; ctx.lineWidth = 7; ctx.stroke()
  ctx.restore()
}
