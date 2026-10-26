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
      const distance = narrow ? 22 : 54
      const lift = narrow ? 18 : 42
      const heroTimeline = gsap.timeline({ defaults: { ease: 'power2.out' } })

      heroTimeline
        .from('[data-home-motion="hero-copy"]', { opacity: 0, y: narrow ? 18 : 32, duration: 0.72 })
        .from('[data-home-motion="hero-image"]', { opacity: 0, scale: narrow ? 0.99 : 0.965, duration: 0.95 }, '-=0.46')

      root.value?.querySelectorAll<HTMLElement>('[data-home-motion="chapter"]').forEach((chapter) => {
        const timeline = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: chapter,
            start: 'top 78%',
            once: true
          }
        })

        timeline
          .from(chapter.querySelector('[data-home-motion="chapter-date"]'), { opacity: 0, x: -distance, duration: 0.72 })
          .from(chapter.querySelector('[data-home-motion="chapter-copy"]'), { opacity: 0, x: distance, duration: 0.78 }, '-=0.5')
          .from(chapter.querySelector('[data-home-motion="chapter-primary-photo"]'), { opacity: 0, y: lift, scale: narrow ? 0.985 : 0.96, duration: 0.9 }, '-=0.48')
          .from(chapter.querySelectorAll('[data-home-motion="chapter-secondary-photo"]'), { opacity: 0, y: lift, scale: narrow ? 0.99 : 0.97, duration: 0.82, stagger: 0.12 }, '-=0.6')
      })

      const galleryInvitation = root.value?.querySelector<HTMLElement>('[data-home-motion="gallery-invitation"]')
      if (galleryInvitation) {
        gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: galleryInvitation,
            start: 'top 78%',
            once: true
          }
        })
          .from(galleryInvitation.querySelector('[data-home-motion="gallery-mark"]'), { opacity: 0, y: lift, rotate: narrow ? -4 : -8, duration: 0.72 })
          .from(galleryInvitation.querySelectorAll('[data-home-motion="gallery-copy"]'), { opacity: 0, y: lift, duration: 0.7, stagger: 0.12 }, '-=0.4')
      }

      const about = root.value?.querySelector<HTMLElement>('[data-home-motion="home-about"]')
      if (about) {
        gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: about,
            start: 'top 78%',
            once: true
          }
        })
          .from(about.querySelector('[data-home-motion="home-about-label"]'), { opacity: 0, x: -distance, duration: 0.62 })
          .from(about.querySelector('[data-home-motion="home-about-copy"]'), { opacity: 0, y: lift, duration: 0.78 }, '-=0.38')
          .from(about.querySelector('[data-home-motion="home-about-link"]'), { opacity: 0, x: distance, duration: 0.62 }, '-=0.42')
      }
    }, root.value)

    cleanup = () => context.revert()
  })

  onScopeDispose(() => {
    disposed = true
    cleanup?.()
  })
}
