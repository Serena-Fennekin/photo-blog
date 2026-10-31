// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import CyclistTransition from '../../app/components/site/CyclistTransition.vue'

it('keeps the source water moving during pending navigation and stops copying when effects are off', () => {
  vi.stubGlobal('ref', ref); vi.stubGlobal('watch', watch); vi.stubGlobal('onMounted', onMounted); vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
  const frames: FrameRequestCallback[] = [], cancel = vi.fn()
  vi.stubGlobal('requestAnimationFrame', vi.fn(callback => { frames.push(callback); return frames.length }))
  vi.stubGlobal('cancelAnimationFrame', cancel)
  const paint = { drawImage: vi.fn(), clearRect: vi.fn() }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(paint as any)
  const live = document.createElement('canvas'); live.dataset.ambientBackground = ''; live.dataset.running = 'true'; live.width = 640; live.height = 480; document.body.append(live)
  const wrapper = mount(CyclistTransition, { props: { snapshot: { html: '', scrollY: 0 }, running: false } })
  try {
    expect(paint.drawImage).toHaveBeenCalledOnce()
    expect(frames.length).toBeGreaterThan(0)
    frames.shift()!(performance.now() + 40)
    expect(paint.drawImage).toHaveBeenCalledTimes(2)
    live.dataset.running = 'false'
    frames.shift()!(performance.now() + 80)
    expect(paint.drawImage).toHaveBeenCalledTimes(2)
    expect(wrapper.get('canvas').attributes('width')).toBe('640')
  } finally { wrapper.unmount(); live.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() }
  expect(cancel).toHaveBeenCalled()
})
