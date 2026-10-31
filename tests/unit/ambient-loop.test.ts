import { expect, it, vi } from 'vitest'
import { createAmbientLoop } from '../../app/utils/ambient-loop'
it('caps drawing frequency, cancels work when paused and cannot restart after disposal', () => {
  const callbacks = new Map<number, FrameRequestCallback>(); let key = 0
  const draw = vi.fn(), cancel = vi.fn((id: number) => callbacks.delete(id))
  const loop = createAmbientLoop(draw, callback => { callbacks.set(++key, callback); return key }, cancel)
  const frame = (time: number) => { const current = [...callbacks.values()]; callbacks.clear(); current.forEach(callback => callback(time)) }
  loop.start(); loop.start()
  expect(callbacks.size).toBe(1)
  frame(0); frame(16); frame(34)
  expect(draw).toHaveBeenCalledTimes(2)
  const stale = [...callbacks.values()][0]!
  loop.stop(); stale(90)
  expect(callbacks.size).toBe(0)
  expect(draw).toHaveBeenCalledTimes(2)
  loop.start(); frame(110)
  expect(draw).toHaveBeenCalledTimes(3)
  loop.dispose(); loop.start(); frame(160)
  expect(callbacks.size).toBe(0)
  expect(draw).toHaveBeenCalledTimes(3)
})
