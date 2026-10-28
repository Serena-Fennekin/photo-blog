import { describe, expect, it } from 'vitest'
import { createWaterField, createRipplePool } from '../../app/utils/ambient-water'
describe('bounded water simulation', () => {
  it('propagates an impulse and dissipates its energy without nonfinite values', () => {
    const field = createWaterField(80, 60)
    expect(field.values.every(value => value === 0)).toBe(true)
    field.disturb(.5, .5, 3)
    const initial = field.energy()
    for (let i = 0; i < 15; i++) field.step()
    expect(field.values.some((value, i) => Math.abs(value) > .01 && Math.abs(i % 80 - 40) > 4)).toBe(true)
    for (let i = 0; i < 1400; i++) field.step()
    expect(field.values.every(Number.isFinite)).toBe(true)
    expect(field.energy()).toBeLessThan(initial * .01)
  })
  it('rejects invalid inputs, clamps excessive impulses and resets cleanly', () => {
    const field = createWaterField(60, 60)
    for (const [x, y] of [[NaN, .5], [.5, Infinity], [-1, .5], [.5, 2]]) field.disturb(x!, y!, 3)
    expect(field.energy()).toBe(0)
    field.disturb(.5, .5, 1e8)
    expect(Math.max(...field.values)).toBeLessThanOrEqual(8)
    field.reset(); expect(field.energy()).toBe(0)
    expect(createWaterField(30, 30).values.length).toBe(900)
    expect(() => createWaterField(1000, 1000)).toThrow()
  })
  it('caps and expires pointer rings instead of accumulating an unbounded history', () => {
    const pool = createRipplePool(24)
    for (let i = 0; i < 1000; i++) pool.add(.5, .5, i, 1)
    expect(pool.active(1000)).toHaveLength(24)
    expect(pool.active(7000)).toHaveLength(0)
    pool.add(NaN, 0, 7001, 1)
    expect(pool.active(7002)).toHaveLength(0)
    // Pointer events can be dispatched just after a RAF timestamp in the same frame.
    pool.add(.5, .5, 7010, 1)
    expect(pool.active(7009)).toHaveLength(0)
    expect(pool.active(7011)).toHaveLength(1)
  })
})
