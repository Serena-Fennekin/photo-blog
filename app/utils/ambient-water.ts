export function createWaterField(columns: number, rows: number) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 8 || rows < 8 || columns * rows > 30000) throw new Error('Invalid water field size')
  let current = new Float32Array(columns * rows), previous = new Float32Array(columns * rows)
  return {
    get values() { return current },
    disturb(x: number, y: number, strength = 3) {
      if (![x, y, strength].every(Number.isFinite) || x < 0 || x > 1 || y < 0 || y > 1) return
      const cx = Math.round(x * (columns - 1)), cy = Math.round(y * (rows - 1)), force = Math.max(-8, Math.min(8, strength))
      for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
        const px = cx + i, py = cy + j
        if (px <= 0 || px >= columns - 1 || py <= 0 || py >= rows - 1) continue
        const index = py * columns + px
        current[index] = Math.max(-8, Math.min(8, current[index]! + force * Math.exp(-(i * i + j * j) / 3)))
      }
    },
    step() {
      for (let y = 1; y < rows - 1; y++) for (let x = 1; x < columns - 1; x++) {
        const i = y * columns + x
        previous[i] = ((current[i - 1]! + current[i + 1]! + current[i - columns]! + current[i + columns]!) * .5 - previous[i]!) * .982
      }
      ;[previous, current] = [current, previous]
    },
    energy() { return current.reduce((sum, value) => sum + value * value, 0) },
    reset() { current.fill(0); previous.fill(0) }
  }
}

export type WaterRipple = { x: number; y: number; born: number; strength: number }
export function createRipplePool(capacity = 48) {
  let ripples: WaterRipple[] = []
  return {
    add(x: number, y: number, born: number, strength = 1) {
      if (![x, y, born, strength].every(Number.isFinite) || x < 0 || x > 1 || y < 0 || y > 1) return
      ripples.push({ x, y, born, strength: Math.max(.2, Math.min(2, strength)) })
      if (ripples.length > capacity) ripples.splice(0, ripples.length - capacity)
    },
    active(now: number) { ripples = ripples.filter(ripple => now - ripple.born < 3600); return ripples.filter(ripple => now >= ripple.born) },
    clear() { ripples = [] }
  }
}
