// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

const motion = vi.hoisted(() => ({
  context: vi.fn(),
  registerPlugin: vi.fn(),
  timeline: vi.fn(),
  from: vi.fn(),
  revert: vi.fn(),
  scrollTriggerPlugin: { name: 'ScrollTrigger' }
}))

vi.mock('gsap', () => ({
  gsap: {
    context: motion.context,
    registerPlugin: motion.registerPlugin,
    timeline: motion.timeline,
    from: motion.from
  }
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: motion.scrollTriggerPlugin
}))

import { useHomeAnimations } from '../../app/composables/useHomeAnimations'

const Harness = defineComponent({
  setup() {
    const root = ref<HTMLElement | null>(null)
    useHomeAnimations(root)
    return { root }
  },
  template: `
    <main ref="root">
      <figure v-for="photo in 2" :key="photo" data-home-motion="featured-photo" />
      <section data-home-motion="gallery-invitation">
        <p data-home-motion="gallery-mark" />
        <div data-home-motion="gallery-copy" />
      </section>
      <section data-home-motion="home-about">
        <p data-home-motion="home-about-label" />
        <p data-home-motion="home-about-copy" />
        <a data-home-motion="home-about-link" />
      </section>
    </main>
  `
})

describe('useHomeAnimations', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    motion.context.mockReset()
    motion.registerPlugin.mockReset()
    motion.timeline.mockReset()
    motion.from.mockReset()
    motion.revert.mockReset()
  })

  it('does not create a GSAP context or timeline when reduced motion is requested', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    const wrapper = mount(Harness)
    await flushPromises()

    expect(motion.context).not.toHaveBeenCalled()
    expect(motion.registerPlugin).not.toHaveBeenCalled()
    expect(motion.timeline).not.toHaveBeenCalled()
    expect(wrapper.get('[data-home-motion="gallery-invitation"]').isVisible()).toBe(true)
    wrapper.unmount()
  })

  it('registers reversible timelines so sections animate again on return', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    motion.context.mockImplementation((callback: () => void, _root: HTMLElement) => {
      callback()
      return { revert: motion.revert }
    })
    motion.timeline.mockReturnValue({ from: vi.fn().mockReturnThis(), to: vi.fn().mockReturnThis() })

    const wrapper = mount(Harness)
    await flushPromises()

    expect(motion.registerPlugin).toHaveBeenCalledOnce()
    expect(motion.registerPlugin).toHaveBeenCalledWith(motion.scrollTriggerPlugin)
    expect(motion.context).toHaveBeenCalledOnce()
    const scrollTimelines = [...motion.timeline.mock.calls.map(([options]) => options), ...motion.from.mock.calls.map(([, options]) => options)]
      .filter(options => options?.scrollTrigger)

    expect(scrollTimelines).toHaveLength(4)
    for (const options of scrollTimelines) {
      expect(options.scrollTrigger).toMatchObject({
        start: 'top 78%',
        toggleActions: 'play reverse play reverse'
      })
      expect(options.scrollTrigger.trigger).toBeInstanceOf(HTMLElement)
    }

    wrapper.unmount()
    expect(motion.revert).toHaveBeenCalledOnce()
  })
})
