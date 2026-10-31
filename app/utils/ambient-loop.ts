export const createAmbientLoop = (
  draw: (time: number) => void,
  request: (callback: FrameRequestCallback) => number = requestAnimationFrame,
  cancel: (id: number) => void = cancelAnimationFrame
) => {
  let frame = 0, active = false, disposed = false, generation = 0, last = -Infinity
  const stop = () => { active = false; generation++; cancel(frame) }
  return {
    start() {
      if (active || disposed) return
      active = true; last = -Infinity
      const version = ++generation
      const tick = (time: number) => {
        if (!active || disposed || version !== generation) return
        if (time - last >= 1000 / 30) { last = time; draw(time) }
        if (active && version === generation) frame = request(tick)
      }
      frame = request(tick)
    },
    stop,
    dispose() { stop(); disposed = true }
  }
}
