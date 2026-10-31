import { expect, it } from 'vitest'
import { irisBufferSize, irisPose } from '../../app/utils/iris-motion'

it('bounds backing pixels and dimensions even on high-DPR and extreme wide screens', () => {
  for (const [width, height, dpr] of [[1280,900,1],[3840,2160,3],[393,852,3],[1000000,100,4]]) {
    const size = irisBufferSize(width!, height!, dpr!)
    expect(size.width * size.height).toBeLessThanOrEqual(1500000)
    expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(4096)
    expect(Math.min(size.width, size.height)).toBeGreaterThan(0)
  }
  expect(irisBufferSize(1280,900,1)).toEqual({ width:1280, height:900 })
})

it('continuously rotates every blade and smoothly accelerates from closed to fully outside', () => {
  const first = irisPose(0), last = irisPose(1)
  expect(first.shift).toBe(0)
  expect(last.shift).toBeGreaterThan(Math.SQRT2)
  for (let i = 0; i < 9; i++) {
    expect(Math.hypot(last.axes[i*2]!,last.axes[i*2+1]!)).toBeCloseTo(1,6)
    expect(Math.hypot(last.axes[i*2]!-first.axes[i*2]!,last.axes[i*2+1]!-first.axes[i*2+1]!)).toBeGreaterThan(.4)
  }
  const steps = Array.from({length:101},(_,i)=>irisPose(i/100).shift)
  for(let i=1;i<steps.length;i++) { expect(steps[i]!).toBeGreaterThanOrEqual(steps[i-1]!); expect(steps[i]!-steps[i-1]!).toBeLessThan(.04) }
  expect(steps[1]!-steps[0]!).toBeLessThan(.0001)
  expect(steps[100]!-steps[99]!).toBeLessThan(.0001)
})
