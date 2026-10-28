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
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger')
    ])
    if (disposed || !root.value) return

    gsap.registerPlugin(ScrollTrigger)

    const context = gsap.context(() => {
      const narrow = window.matchMedia('(max-width: 760px)').matches
      const lift = narrow ? 18 : 42

      const galleryInvitation = root.value?.querySelector<HTMLElement>('[data-home-motion="gallery-invitation"]')
      if (galleryInvitation) {
        gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: galleryInvitation,
            start: 'top 78%',
            toggleActions: 'play reverse play reverse'
          }
        })
          .from(galleryInvitation.querySelector('[data-home-motion="gallery-mark"]'), { opacity: 0, y: lift, rotate: narrow ? -4 : -8, duration: 0.72 })
          .from(galleryInvitation.querySelectorAll('[data-home-motion="gallery-copy"]'), { opacity: 0, y: lift, duration: 0.7, stagger: 0.12 }, '-=0.4')
      }

    }, root.value)

    cleanup = () => context.revert()
  })

  onScopeDispose(() => {
    disposed = true
    cleanup?.()
  })
}
