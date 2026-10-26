import { onMounted, onScopeDispose, type Ref } from 'vue'

export const useHomeAnimations = (root: Ref<HTMLElement | null>): void => {
  let disposed = false
  let cleanup: (() => void) | undefined

  onMounted(async () => {
    const element = root.value
    if (!element || typeof window === 'undefined') return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      element.dataset.motionMode = 'static'
      return
    }

    element.dataset.motionMode = 'animated'
    const { gsap } = await import('gsap')
    if (disposed || !root.value) return

    const context = gsap.context(() => {
      const narrow = window.matchMedia('(max-width: 760px)').matches
      const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
      timeline
        .from('[data-home-motion="hero-copy"]', { opacity: 0, y: narrow ? 18 : 32, duration: 0.72 })
        .from('[data-home-motion="hero-image"]', { opacity: 0, scale: narrow ? 0.99 : 0.965, duration: 0.95 }, '-=0.46')
        .from('[data-home-motion="chapter"]', { opacity: 0, y: narrow ? 12 : 24, duration: 0.58, stagger: 0.08 }, '-=0.34')
    }, root.value)

    cleanup = () => context.revert()
  })

  onScopeDispose(() => {
    disposed = true
    cleanup?.()
  })
}
