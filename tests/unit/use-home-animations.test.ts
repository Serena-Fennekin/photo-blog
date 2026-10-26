// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

const motion = vi.hoisted(() => ({
  context: vi.fn(),
  timeline: vi.fn(),
  revert: vi.fn()
}))

vi.mock('gsap', () => ({
  gsap: {
    context: motion.context,
    timeline: motion.timeline
  }
}))

import { useHomeAnimations } from '../../app/composables/useHomeAnimations'

const Harness = defineComponent({
  setup() {
    const root = ref<HTMLElement | null>(null)
    useHomeAnimations(root)
    return { root }
  },
  template: '<main ref="root"><section data-home-motion="hero">内容始终可见</section></main>'
})

describe('useHomeAnimations', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    motion.context.mockReset()
    motion.timeline.mockReset()
    motion.revert.mockReset()
  })

  it('does not create a GSAP context or timeline when reduced motion is requested', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    const wrapper = mount(Harness)
    await flushPromises()

    expect(motion.context).not.toHaveBeenCalled()
    expect(motion.timeline).not.toHaveBeenCalled()
    expect(wrapper.get('[data-home-motion="hero"]').isVisible()).toBe(true)
    wrapper.unmount()
  })

  it('scopes motion to the root and reverts the context on unmount', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    motion.context.mockImplementation((callback: () => void, _root: HTMLElement) => {
      callback()
      return { revert: motion.revert }
    })
    motion.timeline.mockReturnValue({ from: vi.fn().mockReturnThis(), to: vi.fn().mockReturnThis() })

    const wrapper = mount(Harness)
    await flushPromises()

    expect(motion.context).toHaveBeenCalledOnce()
    expect(motion.timeline).toHaveBeenCalledOnce()
    wrapper.unmount()
    expect(motion.revert).toHaveBeenCalledOnce()
  })
})
